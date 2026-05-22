export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/resend/client";

// POST /api/internal/test-email
// Body: { to: "email@example.com" }
// Sends a simple test email to verify Resend is configured and working.
export async function POST(req: NextRequest) {
  const { to } = await req.json().catch(() => ({}));
  if (!to) return NextResponse.json({ error: "to required" }, { status: 400 });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  try {
    const result = await sendEmail({
      to,
      subject: "Quanta — Resend test email",
      html: `<p>This is a test email from Quanta Scout OS.</p><p>Resend is configured correctly.</p><p>From: <b>${FROM_EMAIL}</b></p>`,
    });

    return NextResponse.json({
      ok: true,
      simulated: result.simulated,
      id: result.id,
      from: FROM_EMAIL,
      to,
      api_key_prefix: RESEND_API_KEY ? RESEND_API_KEY.slice(0, 8) + "…" : "NOT SET",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: String(err),
      from: FROM_EMAIL,
      to,
      api_key_prefix: RESEND_API_KEY ? RESEND_API_KEY.slice(0, 8) + "…" : "NOT SET",
    }, { status: 500 });
  }
}
