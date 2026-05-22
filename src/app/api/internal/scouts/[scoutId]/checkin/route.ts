import { NextRequest, NextResponse } from "next/server";
import { runCheckinForScout } from "@/agents/checkin";

export async function POST(_req: NextRequest, { params }: { params: { scoutId: string } }) {
  try {
    const result = await runCheckinForScout(params.scoutId);
    return NextResponse.json({
      sent: true,
      email_sent: result.email_sent,
      message: result.message,
      info: result.email_sent
        ? "Email delivered via Resend"
        : "Email simulated (RESEND_API_KEY not configured or scout has no email)",
    });
  } catch (err) {
    console.error("[checkin] Failed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
