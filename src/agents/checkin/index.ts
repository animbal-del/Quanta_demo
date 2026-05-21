/**
 * Weekly Check-in Agent
 *
 * Sends personalized check-in messages to scouts based on activity level.
 * Adapts tone: light touch for active scouts, warmer for inactive ones.
 */

import { runTextCompletion } from "@/lib/openai/client";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/openclaw/client";
import {
  WEEKLY_CHECKIN_SYSTEM_PROMPT,
  buildWeeklyCheckinUserPrompt,
  CHECKIN_MESSAGE_VARIANTS,
} from "@/prompts/checkin/weekly-checkin.prompt";
import { AI_MODELS, SCOUT_ACTIVITY } from "@/constants";
import type { Channel, Scout } from "@/types";

export async function runCheckinForScout(scoutId: string): Promise<{ message: string }> {
  const db = getSupabaseAdmin();

  const { data: scout } = await db
    .from("scouts")
    .select("*")
    .eq("id", scoutId)
    .single();

  if (!scout) throw new Error(`Scout ${scoutId} not found`);
  if (scout.status !== "active") return { message: "Scout not active, skipped" };

  const daysSinceActive = scout.last_active_at
    ? Math.floor((Date.now() - new Date(scout.last_active_at).getTime()) / 86400000)
    : 999;

  // Load last submission summary for context
  const { data: lastDeal } = await db
    .from("deals")
    .select("startup_name, one_line_description")
    .eq("source_scout_id", scoutId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSubmissionSummary = lastDeal
    ? `${lastDeal.startup_name ?? "Unknown"}: ${lastDeal.one_line_description ?? ""}`
    : null;

  const { data: pendingTasks } = await db
    .from("missing_info_tasks")
    .select("info_needed")
    .eq("scout_id", scoutId)
    .eq("status", "pending");

  const pendingItems = (pendingTasks ?? []).map((t) => t.info_needed);

  const message = await runTextCompletion(
    WEEKLY_CHECKIN_SYSTEM_PROMPT,
    buildWeeklyCheckinUserPrompt(scout.full_name, daysSinceActive, lastSubmissionSummary, pendingItems),
    AI_MODELS.checkin
  );

  // Send via OpenClaw
  if (scout.openclaw_user_id) {
    await sendMessage({
      openclaw_user_id: scout.openclaw_user_id,
      channel: (scout.preferred_channel ?? "telegram") as Channel,
      message,
    });
  }

  // Update last_checkin_at
  await db
    .from("scouts")
    .update({ last_checkin_at: new Date().toISOString() })
    .eq("id", scoutId);

  return { message };
}

// Determine which message variant to use (fast path, no AI call)
export function selectCheckinVariant(daysSinceActive: number): string {
  if (daysSinceActive <= SCOUT_ACTIVITY.activeThreshold) {
    return randomFrom(CHECKIN_MESSAGE_VARIANTS.active);
  } else if (daysSinceActive <= SCOUT_ACTIVITY.moderateThreshold) {
    return randomFrom(CHECKIN_MESSAGE_VARIANTS.moderate);
  } else if (daysSinceActive <= SCOUT_ACTIVITY.inactiveThreshold) {
    return randomFrom(CHECKIN_MESSAGE_VARIANTS.inactive);
  }
  return randomFrom(CHECKIN_MESSAGE_VARIANTS.reactivation);
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Run check-ins for all eligible scouts
export async function runAllCheckins(): Promise<{ count: number }> {
  const db = getSupabaseAdmin();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: eligibleScouts } = await db
    .from("scouts")
    .select("id")
    .eq("status", "active")
    .or(`last_checkin_at.is.null,last_checkin_at.lt.${sevenDaysAgo}`);

  if (!eligibleScouts) return { count: 0 };

  await Promise.all(eligibleScouts.map((s) => runCheckinForScout(s.id)));
  return { count: eligibleScouts.length };
}
