/**
 * Follow-up Agent
 *
 * Triggered by the scheduler when a missing_info_task.followup_date is reached.
 * Sends a warm follow-up to the scout asking about the promised item.
 */

import { runTextCompletion } from "@/lib/openai/client";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/openclaw/client";
import {
  FOLLOWUP_SYSTEM_PROMPT,
  buildFollowupUserPrompt,
  FOLLOWUP_STALE_PROMPT,
} from "@/prompts/followup/followup.prompt";
import { AI_MODELS, FOLLOWUP_LIMITS } from "@/constants";
import type { Channel } from "@/types";

export async function runFollowupAgent(taskId: string): Promise<{ message: string }> {
  const db = getSupabaseAdmin();

  const { data: task } = await db
    .from("missing_info_tasks")
    .select(`
      *,
      deals(startup_name),
      scouts(full_name, openclaw_user_id, preferred_channel)
    `)
    .eq("id", taskId)
    .single();

  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.status !== "pending") return { message: "Task not pending, skipped" };

  const scoutName = (task.scouts as { full_name: string })?.full_name ?? "Scout";
  const startupName = (task.deals as { startup_name: string | null })?.startup_name ?? "the startup";
  const scout = task.scouts as { openclaw_user_id: string | null; preferred_channel: string | null };

  const isStale = task.reminder_count >= FOLLOWUP_LIMITS.maxReminders;

  const message = await runTextCompletion(
    isStale ? FOLLOWUP_STALE_PROMPT : FOLLOWUP_SYSTEM_PROMPT,
    isStale
      ? `Scout: ${scoutName}, Startup: ${startupName}, Item: ${task.info_needed}, Reminders sent: ${task.reminder_count}`
      : buildFollowupUserPrompt(
          scoutName,
          startupName,
          task.info_needed,
          task.expected_date ?? "soon"
        ),
    AI_MODELS.followup
  );

  // Send via OpenClaw
  if (scout?.openclaw_user_id) {
    await sendMessage({
      openclaw_user_id: scout.openclaw_user_id,
      channel: (scout.preferred_channel ?? "telegram") as Channel,
      message,
    });
  }

  // Update task state
  const newStatus = isStale ? "stale" : "pending";
  await db
    .from("missing_info_tasks")
    .update({
      last_reminded_at: new Date().toISOString(),
      reminder_count: task.reminder_count + 1,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  // Add to deal thread
  await db.from("deal_messages").insert({
    deal_id: task.deal_id,
    sender_type: "ai",
    channel: (scout?.preferred_channel ?? "telegram") as Channel,
    message_type: "text",
    body: message,
  });

  return { message };
}

// Run all due follow-ups for today — called by scheduler endpoint
export async function runDueFollowups(): Promise<{ count: number; messages: string[] }> {
  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  const { data: dueTasks } = await db
    .from("missing_info_tasks")
    .select("id")
    .lte("followup_date", today)
    .eq("status", "pending");

  if (!dueTasks || dueTasks.length === 0) return { count: 0, messages: [] };

  const results = await Promise.all(dueTasks.map((t) => runFollowupAgent(t.id)));
  return {
    count: results.length,
    messages: results.map((r) => r.message),
  };
}
