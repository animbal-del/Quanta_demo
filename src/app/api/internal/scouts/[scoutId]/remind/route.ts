export const dynamic = "force-dynamic";
/**
 * POST /api/internal/scouts/:id/remind
 * Sends a "Have you interacted with any new startups?" email to the scout.
 * Quanta team triggers this manually from the scout management page.
 * Email has Yes/No CTA buttons — responses tracked in email_correspondence.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { sendEmail } from "@/lib/resend/client";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export async function POST(_req: NextRequest, { params }: { params: { scoutId: string } }) {
  const db = getSupabaseAdmin();

  const { data: scout } = await db
    .from("scouts")
    .select("id, full_name, email, focus_areas")
    .eq("id", params.scoutId)
    .single();

  if (!scout?.email) {
    return NextResponse.json({ error: "Scout has no email on record" }, { status: 400 });
  }

  const firstName = scout.full_name.split(" ")[0];
  const focusAreas = (scout.focus_areas ?? []).slice(0, 2).join(" / ");

  const yesUrl  = `${APP_URL}/api/email/respond?scout=${scout.id}&response=yes_have_startup`;
  const noUrl   = `${APP_URL}/api/email/respond?scout=${scout.id}&response=nothing_this_week`;
  const addUrl  = `${APP_URL}/add-startup`;

  const subject = `Hey ${firstName} — any new startups on your radar?`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:20px 32px;">
          <span style="color:#fff;font-size:14px;font-weight:600;">⚡ Quanta Scout</span>
        </td></tr>
        <tr><td style="background:#fff;padding:36px 32px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
          <p style="margin:0 0 4px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:.06em;">Quick check-in</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0a0a0a;">Hey ${firstName} 👋</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.7;">
            Have you come across any interesting founders${focusAreas ? ` in ${focusAreas}` : ""} recently? Even a rough signal — a name, a problem space, someone unusually sharp — is worth a mention.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding-right:8px;width:50%;">
                <a href="${yesUrl}" style="display:block;background:#0a0a0a;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 16px;border-radius:8px;text-align:center;">
                  Yes, I've got something
                </a>
              </td>
              <td style="width:50%;">
                <a href="${noUrl}" style="display:block;background:#f4f4f5;color:#3f3f46;text-decoration:none;font-size:14px;font-weight:500;padding:13px 16px;border-radius:8px;text-align:center;">
                  Nothing this week
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;">
            Or <a href="${addUrl}" style="color:#0a0a0a;font-weight:600;text-decoration:none;">submit directly →</a>
          </p>
        </td></tr>
        <tr><td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#a1a1aa;">Quanta Ventures · Scout Intelligence Platform</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  let result: { id: string | null; simulated: boolean };
  try {
    result = await sendEmail({ to: scout.email, subject, html });
  } catch (err) {
    console.error("[remind] Resend failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  // Log to email_correspondence
  await db.from("email_correspondence").insert({
    scout_id: scout.id,
    email_type: "weekly_checkin",
    subject,
    resend_message_id: result.id,
    sent_at: new Date().toISOString(),
  });

  // Update scout's last email sent timestamp
  await db.from("scouts").update({ last_email_sent_at: new Date().toISOString() }).eq("id", params.scoutId);

  return NextResponse.json({
    sent: true,
    simulated: result.simulated,
    to: scout.email,
    message: result.simulated
      ? `Email simulated (RESEND_API_KEY not set)`
      : `Email sent to ${scout.email}`,
  });
}
