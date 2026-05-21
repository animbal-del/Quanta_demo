import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { sendEmail, buildInviteEmail } from "@/lib/resend/client";

interface InviteRequest {
  full_name: string;
  email: string;
  focus_areas: string[];
  invited_by?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as InviteRequest;

  if (!body.full_name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: "full_name and email are required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Check for duplicate email
  const { data: existing } = await db
    .from("scouts")
    .select("id")
    .eq("email", body.email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "A scout with this email already exists" }, { status: 409 });
  }

  // Create scout record
  const { data: scout, error: scoutError } = await db
    .from("scouts")
    .insert({
      full_name: body.full_name,
      email: body.email,
      focus_areas: body.focus_areas ?? [],
      status: "active",
      invite_status: "invited",
      preferred_channel: "web",
    })
    .select("id, full_name, email")
    .single();

  if (scoutError || !scout) {
    return NextResponse.json({ error: scoutError?.message ?? "Failed to create scout" }, { status: 500 });
  }

  // Create invite token
  const { data: invite, error: inviteError } = await db
    .from("scout_invites")
    .insert({
      email: body.email,
      scout_id: scout.id,
      invited_by: body.invited_by ?? "Quanta Team",
    })
    .select("token")
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: inviteError?.message ?? "Failed to create invite" }, { status: 500 });
  }

  // Send invite email
  const { subject, html } = buildInviteEmail({
    scoutName: scout.full_name,
    inviteToken: invite.token,
    invitedBy: body.invited_by ?? "Quanta Team",
  });

  const emailResult = await sendEmail({ to: body.email, subject, html });

  // Log correspondence
  await db.from("email_correspondence").insert({
    scout_id: scout.id,
    email_type: "invite",
    subject,
    resend_message_id: emailResult.id,
    sent_at: new Date().toISOString(),
  });

  return NextResponse.json({
    scout_id: scout.id,
    invite_token: invite.token,
    email_sent: !emailResult.simulated,
    simulated: emailResult.simulated,
    message: emailResult.simulated
      ? `Scout created. Email simulated (add RESEND_API_KEY to send for real).`
      : `Invite sent to ${body.email}`,
  });
}
