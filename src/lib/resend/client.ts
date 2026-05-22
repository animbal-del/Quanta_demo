/**
 * Resend Email Client
 *
 * Handles all outbound emails: scout invites, weekly check-ins, follow-ups.
 * In demo/unconfigured mode, logs to console instead of sending.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

function getAppOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    return new URL(configured).origin;
  } catch {
    return "http://localhost:3000";
  }
}

const APP_URL = getAppOrigin();

function isResendConfigured() {
  return Boolean(RESEND_API_KEY && !RESEND_API_KEY.startsWith("TODO_"));
}

interface SendEmailParams { to: string; subject: string; html: string }
interface SendEmailResult { id: string | null; simulated: boolean }

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!isResendConfigured()) {
    console.log(`[Resend Simulated] To: ${params.to} | Subject: ${params.subject}`);
    return { id: null, simulated: true };
  }
  const { Resend } = await import("resend");
  const resend = new Resend(RESEND_API_KEY);
  const result = await resend.emails.send({ from: FROM_EMAIL, to: params.to, subject: params.subject, html: params.html });
  return { id: result.data?.id ?? null, simulated: false };
}

// ─── Shared layout wrapper ─────────────────────────────────────────────────────
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Quanta Scout</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;border-radius:12px 12px 0 0;padding:20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background:rgba(255,255,255,0.12);border-radius:8px;width:30px;height:30px;text-align:center;vertical-align:middle;">
                          <span style="font-size:14px;line-height:30px;">⚡</span>
                        </td>
                        <td style="padding-left:10px;">
                          <span style="color:#ffffff;font-size:14px;font-weight:600;letter-spacing:-0.01em;">Quanta Scout</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">
                Quanta Ventures · Scout Intelligence Platform<br/>
                <a href="${APP_URL}" style="color:#71717a;text-decoration:none;">quanta-scout-os.vercel.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Primary CTA button ────────────────────────────────────────────────────────
function primaryButton(href: string, label: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td>
        <a href="${href}" style="display:inline-block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 28px;border-radius:8px;letter-spacing:-0.01em;">${label} →</a>
      </td>
    </tr>
  </table>`;
}

function secondaryButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#f4f4f5;color:#3f3f46;text-decoration:none;font-size:14px;font-weight:500;padding:13px 24px;border-radius:8px;">${label}</a>`;
}

function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
    <tr><td style="border-top:1px solid #f4f4f5;height:1px;"></td></tr>
  </table>`;
}

// ─── 1. Invite email ───────────────────────────────────────────────────────────
export function buildInviteEmail(params: {
  scoutName: string;
  inviteToken: string;
  invitedBy: string;
}): { subject: string; html: string } {
  // Route group (auth) is transparent — correct URL is /complete-signup
  const link = `${APP_URL}/complete-signup?token=${params.inviteToken}`;
  const firstName = params.scoutName.split(" ")[0];

  const content = `
    <p style="margin:0 0 4px;font-size:12px;font-weight:500;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">You're invited</p>
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0a0a0a;letter-spacing:-0.02em;">Welcome, ${firstName}.</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.7;">
      <strong style="color:#0a0a0a;">${params.invitedBy}</strong> has invited you to join Quanta's scout network.
      You'll submit startup leads, track their progress through the pipeline, and
      hear back directly when Quanta has questions.
    </p>

    <!-- What to expect -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fafafa;border:1px solid #f4f4f5;border-radius:10px;padding:20px;margin-bottom:28px;">
      <tr>
        <td>
          <p style="margin:0 0 14px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">What you get access to</p>
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="padding-bottom:10px;vertical-align:top;padding-right:10px;font-size:16px;">📥</td>
              <td style="padding-bottom:10px;vertical-align:top;"><span style="font-size:14px;color:#3f3f46;line-height:1.5;">Submit startup leads in under 2 minutes — by voice, form, or document upload</span></td>
            </tr>
            <tr>
              <td style="padding-bottom:10px;vertical-align:top;padding-right:10px;font-size:16px;">📊</td>
              <td style="padding-bottom:10px;vertical-align:top;"><span style="font-size:14px;color:#3f3f46;line-height:1.5;">Track every startup you've introduced through the Quanta pipeline</span></td>
            </tr>
            <tr>
              <td style="vertical-align:top;padding-right:10px;font-size:16px;">💬</td>
              <td style="vertical-align:top;"><span style="font-size:14px;color:#3f3f46;line-height:1.5;">Get questions from the team and reply directly — no CRM, no forms</span></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${primaryButton(link, "Complete Account Setup")}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
      This link expires in <strong style="color:#71717a;">7 days</strong>.
      If you didn't expect this invite, you can safely ignore this email.
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#a1a1aa;">
      Can't click the button? Copy this URL:<br/>
      <span style="color:#71717a;word-break:break-all;">${link}</span>
    </p>
  `;

  return {
    subject: `${params.invitedBy} invited you to Quanta Scout`,
    html: emailWrapper(content),
  };
}

// ─── 2. Weekly check-in email ─────────────────────────────────────────────────
export function buildWeeklyCheckinEmail(params: {
  scoutName: string;
  scoutId: string;
}): { subject: string; html: string } {
  const yesUrl  = `${APP_URL}/api/email/respond?scout=${params.scoutId}&response=yes_have_startup`;
  const noUrl   = `${APP_URL}/api/email/respond?scout=${params.scoutId}&response=nothing_this_week`;
  const addUrl  = `${APP_URL}/add-startup`;
  const firstName = params.scoutName.split(" ")[0];

  const content = `
    <p style="margin:0 0 4px;font-size:12px;font-weight:500;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">Weekly check-in</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0a0a0a;letter-spacing:-0.02em;">Hey ${firstName} 👋</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#52525b;line-height:1.7;">
      Anything interesting cross your radar this week? Could be a startup, a founder you met,
      or just a problem you keep hearing about. Even a rough signal is useful.
    </p>

    <!-- CTA buttons -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
      <tr>
        <td style="padding-right:8px;width:50%;">
          <a href="${yesUrl}" style="display:block;background:#0a0a0a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:13px 16px;border-radius:8px;text-align:center;">
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

    ${divider()}

    <p style="margin:0;font-size:13px;color:#a1a1aa;text-align:center;line-height:1.6;">
      Or go straight to <a href="${addUrl}" style="color:#0a0a0a;font-weight:600;text-decoration:none;">Add Startup →</a>
    </p>
  `;

  return {
    subject: "Seen anything interesting this week?",
    html: emailWrapper(content),
  };
}

// ─── 3. Follow-up email ────────────────────────────────────────────────────────
export function buildFollowupEmail(params: {
  scoutName: string;
  startupName: string;
  missingItem: string;
  promisedDate: string;
}): { subject: string; html: string } {
  const portalUrl = `${APP_URL}/scout`;
  const firstName = params.scoutName.split(" ")[0];

  const content = `
    <p style="margin:0 0 4px;font-size:12px;font-weight:500;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">Follow-up</p>
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0a0a0a;letter-spacing:-0.02em;">Quick note on ${params.startupName}</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.7;">
      Hey ${firstName} — you mentioned you'd try to get the
      <strong style="color:#0a0a0a;">${params.missingItem}</strong>
      for ${params.startupName} by <strong style="color:#0a0a0a;">${params.promisedDate}</strong>.
      Were you able to get it?
    </p>

    <!-- Status box -->
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#fafafa;border:1px solid #f4f4f5;border-left:3px solid #0a0a0a;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:28px;">
      <tr>
        <td>
          <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.06em;">Pending</p>
          <p style="margin:0;font-size:14px;color:#0a0a0a;font-weight:500;">${params.missingItem} · ${params.startupName}</p>
        </td>
      </tr>
    </table>

    ${primaryButton(portalUrl, "Update in portal")}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.6;">
      No pressure — if it's not ready yet, just reply with a new date and we'll follow up then.
    </p>
  `;

  return {
    subject: `Quick follow-up on ${params.startupName}`,
    html: emailWrapper(content),
  };
}

// ─── 4. Custom email (from scout detail page) ──────────────────────────────────
export function buildCustomEmail(params: {
  scoutName: string;
  body: string;
}): { subject: string; html: string } {
  const content = `
    <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.7;white-space:pre-wrap;">${params.body}</p>
    ${divider()}
    <p style="margin:0;font-size:13px;color:#a1a1aa;">— The Quanta Team</p>
  `;
  return {
    subject: `Message from Quanta`,
    html: emailWrapper(content),
  };
}
