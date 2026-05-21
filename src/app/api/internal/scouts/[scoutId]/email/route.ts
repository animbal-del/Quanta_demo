import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { sendEmail } from "@/lib/resend/client";

export async function POST(req: NextRequest, { params }: { params: { scoutId: string } }) {
  const { subject, body } = await req.json();

  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: "subject and body are required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data: scout } = await db
    .from("scouts")
    .select("full_name, email")
    .eq("id", params.scoutId)
    .single();

  if (!scout?.email) {
    return NextResponse.json({ error: "Scout has no email on record" }, { status: 400 });
  }

  const result = await sendEmail({
    to: scout.email,
    subject,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
      <p style="color:#0a0a0a;font-size:15px;line-height:1.7;">${body.replace(/\n/g, "<br/>")}</p>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">— Quanta Ventures</p>
    </div>`,
  });

  // Log in email_correspondence
  await db.from("email_correspondence").insert({
    scout_id: params.scoutId,
    email_type: "custom",
    subject,
    resend_message_id: result.id,
    sent_at: new Date().toISOString(),
  });

  return NextResponse.json({ sent: true, simulated: result.simulated });
}
