/**
 * Weekly Check-in Agent
 *
 * Sends personalized check-in emails to scouts via Resend.
 * Includes yes/no CTA buttons. Also creates in-app notification.
 */

import { runTextCompletion } from "@/lib/openai/client";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { sendEmail, buildWeeklyCheckinEmail } from "@/lib/resend/client";
import {
  WEEKLY_CHECKIN_SYSTEM_PROMPT,
  buildWeeklyCheckinUserPrompt,
  CHECKIN_MESSAGE_VARIANTS,
} from "@/prompts/checkin/weekly-checkin.prompt";
import { AI_MODELS, SCOUT_ACTIVITY } from "@/constants";

export async function runCheckinForScout(scoutId: string): Promise<{ message: string; email_sent: boolean }> {
  const db = getSupabaseAdmin();

  const { data: scout } = await db
    .from("scouts")
    .select("*")
    .eq("id", scoutId)
    .single();

  if (!scout) throw new Error(`Scout ${scoutId} not found`);
  if (scout.status !== "active") return { message: "Scout not active, skipped", email_sent: false };

  const daysSinceActive = scout.last_active_at
    ? Math.floor((Date.now() - new Date(scout.last_active_at).getTime()) / 86400000)
    : 999;

  // Get context for the AI-generated message
  const { data: lastDeal } = await db
    .from("deals")
    .select("startup_name, one_line_description")
    .eq("source_scout_id", scoutId)
    .neq("status", "temp")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: pendingTasks } = await db
    .from("missing_info_tasks")
    .select("info_needed")
    .eq("scout_id", scoutId)
    .eq("status", "pending");

  const pendingItems = (pendingTasks ?? []).map((t) => t.info_needed);
  const lastSubmissionSummary = lastDeal
    ? `${lastDeal.startup_name ?? "Unknown"}: ${lastDeal.one_line_description ?? ""}`
    : null;

  // Generate personalised message with Groq
  const message = await runTextCompletion(
    WEEKLY_CHECKIN_SYSTEM_PROMPT,
    buildWeeklyCheckinUserPrompt(scout.full_name, daysSinceActive, lastSubmissionSummary, pendingItems),
    AI_MODELS.checkin
  );

  // ── Send via Resend email (yes/no CTA) ──────────────────────────────────────
  let emailSent = false;
  if (scout.email) {
    try {
      const { subject, html } = buildWeeklyCheckinEmail({
        scoutName: scout.full_name,
        scoutId: scout.id,
      });
      const result = await sendEmail({ to: scout.email, subject, html });
      emailSent = !result.simulated;

      // Log to email_correspondence
      await db.from("email_correspondence").insert({
        scout_id: scout.id,
        email_type: "weekly_checkin",
        subject,
        resend_message_id: result.id,
        sent_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[checkin] Email failed for ${scout.id}:`, err);
    }
  }

  // ── Create in-app notification (visible in scout dashboard) ─────────────────
  // Store as a special deal_message not linked to any deal — scout sees it in notifications
  await db.from("email_correspondence").upsert({
    scout_id: scout.id,
    email_type: "weekly_checkin",
    subject: "Quanta check-in",
    sent_at: new Date().toISOString(),
    response: null,
  }, { onConflict: "scout_id,email_type,sent_at" });

  // ── Update scout record ──────────────────────────────────────────────────────
  await db.from("scouts").update({
    last_checkin_at: new Date().toISOString(),
    last_email_sent_at: new Date().toISOString(),
  }).eq("id", scoutId);

  return { message, email_sent: emailSent };
}

export function selectCheckinVariant(daysSinceActive: number): string {
  if (daysSinceActive <= SCOUT_ACTIVITY.activeThreshold) return randomFrom(CHECKIN_MESSAGE_VARIANTS.active);
  if (daysSinceActive <= SCOUT_ACTIVITY.moderateThreshold) return randomFrom(CHECKIN_MESSAGE_VARIANTS.moderate);
  if (daysSinceActive <= SCOUT_ACTIVITY.inactiveThreshold) return randomFrom(CHECKIN_MESSAGE_VARIANTS.inactive);
  return randomFrom(CHECKIN_MESSAGE_VARIANTS.reactivation);
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function runAllCheckins(): Promise<{ count: number; emails_sent: number }> {
  const db = getSupabaseAdmin();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: eligibleScouts } = await db
    .from("scouts")
    .select("id")
    .eq("status", "active")
    .not("email", "is", null) // only scouts with email addresses
    .or(`last_checkin_at.is.null,last_checkin_at.lt.${sevenDaysAgo}`);

  if (!eligibleScouts) return { count: 0, emails_sent: 0 };

  const results = await Promise.allSettled(eligibleScouts.map((s) => runCheckinForScout(s.id)));
  const emailsSent = results.filter(
    (r) => r.status === "fulfilled" && r.value.email_sent
  ).length;

  return { count: eligibleScouts.length, emails_sent: emailsSent };
}
