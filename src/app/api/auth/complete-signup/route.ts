import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

interface CompleteSignupRequest {
  token: string;
  password: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as CompleteSignupRequest;

  if (!body.token || !body.password) {
    return NextResponse.json({ error: "token and password are required" }, { status: 400 });
  }

  if (body.password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Validate invite token
  const { data: invite, error: inviteError } = await db
    .from("scout_invites")
    .select("id, email, scout_id, status, expires_at")
    .eq("token", body.token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "This invite has already been used" }, { status: 400 });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite link has expired" }, { status: 400 });
  }

  // Create Supabase Auth user
  const { data: authUser, error: authError } = await db.auth.admin.createUser({
    email: invite.email,
    password: body.password,
    phone: body.phone,
    email_confirm: true, // auto-confirm since they clicked the invite link
    user_metadata: { scout_id: invite.scout_id },
  });

  if (authError || !authUser.user) {
    return NextResponse.json({ error: authError?.message ?? "Failed to create account" }, { status: 500 });
  }

  // Set user role
  await db.from("user_roles").insert({
    user_id: authUser.user.id,
    role: "scout",
  });

  // Link Supabase user to scout record
  await db.from("scouts").update({
    supabase_user_id: authUser.user.id,
    invite_status: "active",
    phone: body.phone,
  }).eq("id", invite.scout_id);

  // Mark invite as accepted
  await db.from("scout_invites").update({ status: "accepted" }).eq("id", invite.id);

  return NextResponse.json({ success: true, email: invite.email });
}

// GET — validate token before showing the form
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "No token provided" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  const { data: invite } = await db
    .from("scout_invites")
    .select("email, status, expires_at, scouts(full_name)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invalid invite link" });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ valid: false, error: "This invite has already been used" });
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "This invite link has expired" });
  }

  const scout = Array.isArray(invite.scouts) ? invite.scouts[0] : invite.scouts;

  return NextResponse.json({
    valid: true,
    email: invite.email,
    name: (scout as { full_name: string } | null)?.full_name ?? "",
  });
}
