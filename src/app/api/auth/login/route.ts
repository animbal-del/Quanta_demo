import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/client";

function friendlyAuthError(message: string | undefined): string {
  if (!message) return "Something went wrong. Please try again.";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials") || m.includes("invalid email or password"))
    return "Incorrect email or password. Please check and try again.";
  if (m.includes("email not confirmed"))
    return "Your email isn't confirmed yet. Check your inbox for a confirmation link.";
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "Too many failed attempts. Please wait a few minutes before trying again.";
  if (m.includes("user not found"))
    return "No account found with this email address.";
  if (m.includes("disabled") || m.includes("banned"))
    return "This account has been disabled. Contact the Quanta team.";
  if (m.includes("invalid api key") || m.includes("api key"))
    return "Service configuration error. Contact the Quanta team.";
  return message.charAt(0).toUpperCase() + message.slice(1);
}

export async function POST(req: NextRequest) {
  let email: string, password: string;
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email?.trim()) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!password?.trim()) return NextResponse.json({ error: "Password is required." }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[login] Missing Supabase env vars — check Vercel environment variables");
    return NextResponse.json(
      { error: "Login service is not configured. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your Vercel environment variables, then redeploy." },
      { status: 503 }
    );
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: friendlyAuthError(error?.message) }, { status: 401 });
  }

  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  if (roleError || !roleData) {
    return NextResponse.json(
      { error: "Your account is not fully set up yet. Contact the Quanta team to get access." },
      { status: 403 }
    );
  }

  const role = roleData.role as "scout" | "quanta" | "admin";
  let scoutId: string | null = null;
  let displayName: string = data.user.email ?? email;

  if (role === "scout") {
    const db = getSupabaseAdmin();

    // Try by supabase_user_id first
    let { data: scout } = await db
      .from("scouts")
      .select("id, full_name, supabase_user_id")
      .eq("supabase_user_id", data.user.id)
      .maybeSingle();

    // Fallback: find by email (handles cases where supabase_user_id wasn't linked)
    if (!scout && data.user.email) {
      const { data: scoutByEmail } = await db
        .from("scouts")
        .select("id, full_name, supabase_user_id")
        .eq("email", data.user.email.toLowerCase())
        .maybeSingle();

      if (scoutByEmail) {
        scout = scoutByEmail;
        // Auto-link the supabase_user_id so future logins work directly
        await db
          .from("scouts")
          .update({ supabase_user_id: data.user.id, invite_status: "active" })
          .eq("id", scoutByEmail.id);
      }
    }

    if (!scout) {
      return NextResponse.json(
        { error: `No scout profile found for ${data.user.email}. Ask the Quanta team to invite you via /scouts → Add Scout.` },
        { status: 404 }
      );
    }

    scoutId = scout.id;
    displayName = scout.full_name;
  }

  const response = NextResponse.json({
    role,
    user_id: data.user.id,
    email: data.user.email,
    display_name: displayName,
    scout_id: scoutId,
    redirect: role === "scout" ? "/scout" : "/inbox",
  });

  // Stamp role into a dedicated cookie so middleware can route without a DB query
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
  response.cookies.set("quanta_role", role, cookieOpts);
  if (scoutId) response.cookies.set("quanta_scout_id", scoutId, cookieOpts);

  // Clear stale demo cookies
  response.cookies.delete("quanta_demo_role");
  return response;
}
