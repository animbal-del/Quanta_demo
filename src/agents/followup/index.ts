/**
 * Follow-up Agent
 *
 * Sends follow-up emails to scouts when a missing_info_task is overdue.
 * Also supports immediate "ask now" for tasks without a due date.
 */

import { getSupabaseAdmin } from "@/lib/supabase/client";
import { sendEmail, buildFollowupEmail } from "@/lib/resend/client";
import { FOLLOWUP_LIMITS } from "@/constants";

export async function runFollowupAgent(taskId: string): Promise<{ sent: boolean; message: string }> {
  const db = getSupabaseAdmin();

  const { data: task } = await db
    .from("missing_info_tasks")
    .select(`*, deals(startup_name), scouts(full_name, email)`)
    .eq("id", taskId)
    .single();

  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.status !== "pending") return { sent: false, message: "Task not pending, skipped" };

  const scoutName  = (task.scouts  as { full_name: string; email: string | null } | null)?.full_name ?? "Scout";
  const scoutEmail = (task.scouts  as { full_name: string; email: string | null } | null)?.email ?? null;
  const startupName = (task.deals  as { startup_name: string | null } | null)?.startup_name ?? "the startup";

  if (!scoutEmail) {
    return { sent: false, message: `Scout has no email on record — skipped` };
  }

  const isStale = (task.reminder_count ?? 0) >= FOLLOWUP_LIMITS.maxReminders;
  if (isStale) {
    await db.from("missing_info_tasks").update({ status: "stale" }).eq("id", taskId);
    return { sent: false, message: "Max reminders reached — marked stale" };
  }

  const promisedDate = task.expected_date ?? "soon";
  const { subject, html } = buildFollowupEmail({
    scoutName,
    startupName,
    missingItem: task.info_needed,
    promisedDate,
  });

  let emailSent = false;
  try {
    const result = await sendEmail({ to: scoutEmail, subject, html });
    emailSent = !result.simulated;

    // Log to email_correspondence
    await db.from("email_correspondence").insert({
      scout_id: task.scout_id ?? null,
      email_type: "followup_reminder",
      subject,
      resend_message_id: result.id,
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(`[followup] Email failed for task ${taskId}:`, err);
    return { sent: false, message: `Email failed: ${String(err)}` };
  }

  // Update task — increment reminder count
  await db.from("missing_info_tasks").update({
    last_reminded_at: new Date().toISOString(),
    reminder_count: (task.reminder_count ?? 0) + 1,
    updated_at: new Date().toISOString(),
  }).eq("id", taskId);

  const msg = emailSent
    ? `Follow-up sent to ${scoutEmail} for "${task.info_needed}"`
    : `Simulated (no RESEND_API_KEY) — would send to ${scoutEmail}`;

  return { sent: emailSent, message: msg };
}

// Run all overdue follow-ups — called by the scheduler and "Run Follow-up Agent" button
export async function runDueFollowups(): Promise<{ count: number; sent: number; results: { task: string; message: string }[] }> {
  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  // Pick up tasks that are overdue (followup_date <= today) OR have no date set (null)
  const { data: dueTasks } = await db
    .from("missing_info_tasks")
    .select("id, info_needed")
    .or(`followup_date.lte.${today},followup_date.is.null`)
    .eq("status", "pending")
    .limit(50);

  if (!dueTasks || dueTasks.length === 0) return { count: 0, sent: 0, results: [] };

  const results = await Promise.allSettled(dueTasks.map((t) => runFollowupAgent(t.id)));

  const resolved = results.map((r, i) => ({
    task: dueTasks[i].info_needed,
    message: r.status === "fulfilled" ? r.value.message : String((r as PromiseRejectedResult).reason),
  }));

  const sent = results.filter(
    (r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<{ sent: boolean }>).value.sent
  ).length;

  return { count: dueTasks.length, sent, results: resolved };
}
