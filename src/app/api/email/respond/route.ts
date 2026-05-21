import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scoutId = searchParams.get("scout");
  const response = searchParams.get("response") as "yes_have_startup" | "nothing_this_week" | null;

  if (!scoutId || !response) {
    return new NextResponse("Invalid link.", { status: 400 });
  }

  const db = getSupabaseAdmin();
  const now = new Date().toISOString();

  // Update the most recent unanswered weekly check-in
  const { data: correspondence } = await db
    .from("email_correspondence")
    .select("id")
    .eq("scout_id", scoutId)
    .eq("email_type", "weekly_checkin")
    .is("responded_at", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (correspondence) {
    await db.from("email_correspondence").update({
      response,
      responded_at: now,
      clicked_at: now,
    }).eq("id", correspondence.id);
  }

  // Update scout's last responded timestamp
  await db.from("scouts").update({ last_email_responded_at: now }).eq("id", scoutId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (response === "yes_have_startup") {
    return NextResponse.redirect(`${appUrl}/add-startup`);
  }

  // "nothing_this_week" — show a simple thank-you page
  return new NextResponse(`
<!DOCTYPE html>
<html>
<head><title>Got it</title><meta charset="utf-8" />
<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;text-align:center;max-width:360px;}
h2{margin:0 0 8px;font-size:18px;color:#111;}p{margin:0;color:#6b7280;font-size:14px;}</style>
</head>
<body>
<div class="card">
  <p style="font-size:28px;margin-bottom:12px">👍</p>
  <h2>Noted, thanks!</h2>
  <p>We'll check in again next week. If anything comes up in the meantime, just open the app.</p>
  <a href="${appUrl}/scout" style="display:inline-block;margin-top:20px;background:#111;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Open Scout Portal</a>
</div>
</body>
</html>
  `, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
