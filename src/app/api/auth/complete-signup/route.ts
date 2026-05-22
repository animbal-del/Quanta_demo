import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

interface CompleteSignupRequest {
  token: string;
  password: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  let body: CompleteSignupRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Validate inputs
  if (!body.token?.trim())
    return NextResponse.json({ error: "Invite token is missing. Use the link from your email." }, { status: 400 });
  if (!body.password)
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  if (body.password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
  if (/^\s+$/.test(body.password))
    return NextResponse.json({ error: "Password cannot be only spaces." }, { status: 400 });

  const db = getSupabaseAdmin();

  // Validate invite token
  const { data: invite, error: inviteError } = await db
    .from("scout_invites")
    .select("id, email, scout_id, status, expires_at")
    .eq("token", body.token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: "This invite link is invalid. Ask the Quanta team to send you a new one." },
      { status: 400 }
    );
  }

  if (invite.status === "accepted") {
    return NextResponse.json(
      { error: "This invite has already been used. Try signing in instead, or ask for a new invite." },
      { status: 400 }
    );
  }

  if (invite.status === "expired" || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "This invite link has expired (links are valid for 7 days). Ask the Quanta team to resend it." },
      { status: 400 }
    );
  }

  // Check if a Supabase Auth user already exists for this email
  const { data: existingUsers } = await db.auth.admin.listUsers();
  const alreadyExists = existingUsers?.users?.some((u) => u.email === invite.email);
  if (alreadyExists) {
    return NextResponse.json(
      { error: "An account for this email already exists. Try signing in, or contact the Quanta team." },
      { status: 409 }
    );
  }

  // Create Supabase Auth user
  const { data: authUser, error: authError } = await db.auth.admin.createUser({
    email: invite.email,
    password: body.password,
    phone: body.phone || undefined,
    email_confirm: true,
    user_metadata: { scout_id: invite.scout_id },
  });

  if (authError || !authUser.user) {
    const msg = authError?.message ?? "";
    let friendly = "Failed to create your account. Please try again.";
    if (msg.includes("already registered") || msg.includes("already exists"))
      friendly = "An account with this email already exists. Try signing in.";
    else if (msg.includes("password"))
      friendly = "Password doesn't meet requirements. Use at least 8 characters.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }

  // Set scout role
  const { error: roleError } = await db.from("user_roles").insert({
    user_id: authUser.user.id,
    role: "scout",
  });
  if (roleError) {
    console.error("[complete-signup] Failed to set role:", roleError.message);
    // Don't block — user can still log in and we can fix role manually
  }

  // Link auth user to scout record
  await db.from("scouts").update({
    supabase_user_id: authUser.user.id,
    invite_status: "active",
    phone: body.phone || null,
  }).eq("id", invite.scout_id);

  // Mark invite as accepted
  await db.from("scout_invites").update({ status: "accepted" }).eq("id", invite.id);

  return NextResponse.json({ success: true, email: invite.email });
}

// GET — validate token before rendering the form
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");

  if (!token?.trim()) {
    return NextResponse.json(
      { valid: false, error: "No invite token found in the link. Use the full link from your email." }
    );
  }

  const db = getSupabaseAdmin();

  const { data: invite } = await db
    .from("scout_invites")
    .select("email, status, expires_at, scouts(full_name)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({
      valid: false,
      error: "This invite link is not recognised. It may have been deleted. Ask for a new invite."
    });
  }

  if (invite.status === "accepted") {
    return NextResponse.json({
      valid: false,
      error: "This invite has already been used. Try signing in, or ask the Quanta team for a new invite."
    });
  }

  if (invite.status === "expired" || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({
      valid: false,
      error: "This invite link expired. Invite links are valid for 7 days. Ask the Quanta team to send a new one."
    });
  }

  const scout = Array.isArray(invite.scouts) ? invite.scouts[0] : invite.scouts;

  return NextResponse.json({
    valid: true,
    email: invite.email,
    name: (scout as { full_name: string } | null)?.full_name ?? "",
  });
}
