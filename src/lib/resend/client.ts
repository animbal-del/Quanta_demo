/**
 * Resend Email Client
 *
 * Handles all outbound emails: scout invites, weekly check-ins, follow-ups.
 * In demo mode (no RESEND_API_KEY), logs emails to console instead of sending.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

function isResendConfigured() {
  return Boolean(RESEND_API_KEY && !RESEND_API_KEY.startsWith("TODO_"));
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendEmailResult {
  id: string | null;
  simulated: boolean;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!isResendConfigured()) {
    console.log(`[Resend Simulated] To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log(`Body (truncated): ${params.html.slice(0, 200)}...`);
    return { id: null, simulated: true };
  }

  const { Resend } = await import("resend");
  const resend = new Resend(RESEND_API_KEY);

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  return { id: result.data?.id ?? null, simulated: false };
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export function buildInviteEmail(params: {
  scoutName: string;
  inviteToken: string;
  invitedBy: string;
}): { subject: string; html: string } {
  const link = `${APP_URL}/auth/complete-signup?token=${params.inviteToken}`;

  return {
    subject: "You're invited to join Quanta Scout OS",
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#4F46E5;padding:24px 32px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:16px;">⚡</span>
        </div>
        <span style="color:white;font-weight:600;font-size:14px;">Quanta Scout OS</span>
      </div>
    </div>
    <div style="padding:32px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#0a0a0a;">Hi ${params.scoutName},</h1>
      <p style="margin:0 0 24px;color:#6b7280;line-height:1.6;">
        ${params.invitedBy} has invited you to join Quanta's scout network. You'll be able to submit startup leads and track their progress — all through a lightweight, chat-first experience.
      </p>
      <a href="${link}" style="display:inline-block;background:#4F46E5;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Complete Setup →
      </a>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">
        This link expires in 7 days. If you didn't expect this email, ignore it.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

export function buildWeeklyCheckinEmail(params: {
  scoutName: string;
  scoutId: string;
}): { subject: string; html: string } {
  const yesUrl = `${APP_URL}/api/email/respond?scout=${params.scoutId}&response=yes_have_startup`;
  const noUrl = `${APP_URL}/api/email/respond?scout=${params.scoutId}&response=nothing_this_week`;
  const addUrl = `${APP_URL}/add-startup`;

  return {
    subject: "Seen anything interesting lately?",
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="padding:32px;">
      <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Scout check-in</p>
      <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#0a0a0a;">Hi ${params.scoutName} 👋</h1>
      <p style="margin:0 0 28px;color:#374151;line-height:1.6;font-size:15px;">
        Any founders or startups cross your radar this week? Even a rough signal is useful — a name, a problem, someone who seemed unusually sharp.
      </p>
      <div style="display:flex;gap:12px;">
        <a href="${yesUrl}" style="flex:1;display:inline-block;background:#4F46E5;color:white;padding:12px 0;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;text-align:center;">
          Yes, I've got something
        </a>
        <a href="${noUrl}" style="flex:1;display:inline-block;background:#f3f4f6;color:#374151;padding:12px 0;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;text-align:center;">
          Nothing this week
        </a>
      </div>
      <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
        Or <a href="${addUrl}" style="color:#4F46E5;text-decoration:none;">go directly to Add Startup →</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

export function buildFollowupEmail(params: {
  scoutName: string;
  startupName: string;
  missingItem: string;
  promisedDate: string;
}): { subject: string; html: string } {
  return {
    subject: `Quick follow-up on ${params.startupName}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#f9fafb;margin:0;padding:40px 20px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#374151;line-height:1.6;font-size:15px;">
        Hi ${params.scoutName}, you mentioned you'd try to get the <strong>${params.missingItem}</strong> for ${params.startupName} by ${params.promisedDate}. Were you able to get it?
      </p>
      <p style="margin:0;color:#6b7280;font-size:13px;">
        No pressure — just reply to this email or open the portal to update the status.
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}
