import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Map Supabase raw error messages → friendly user-facing messages
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
  if (m.includes("network") || m.includes("fetch"))
    return "Connection error. Check your internet and try again.";

  // Catch-all: return the original but capitalised
  return message.charAt(0).toUpperCase() + message.slice(1);
}

export async function POST(req: NextRequest) {
  // 1. Validate body
  let email: string, password: string;
  try {
    ({ email, password } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email?.trim())    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!password?.trim()) return NextResponse.json({ error: "Password is required." }, { status: 400 });

  // 2. Check env vars are present (catches Vercel missing-var deploys)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("[login] Supabase env vars not set");
    return NextResponse.json(
      { error: "Service configuration error. Contact the Quanta team." },
      { status: 503 }
    );
  }

  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  // 3. Sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { error: friendlyAuthError(error?.message) },
      { status: 401 }
    );
  }

  // 4. Get user role
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  if (roleError || !roleData) {
    // User exists in auth but has no role — setup incomplete
    return NextResponse.json(
      { error: "Your account is not fully set up yet. Contact the Quanta team to get access." },
      { status: 403 }
    );
  }

  const role = roleData.role as "scout" | "quanta" | "admin";

  // 5. For scouts, get their scout record
  let scoutId: string | null = null;
  let displayName: string = data.user.email ?? email;

  if (role === "scout") {
    const { data: scout } = await supabase
      .from("scouts")
      .select("id, full_name")
      .eq("supabase_user_id", data.user.id)
      .single();

    if (!scout) {
      // Auth exists, role is scout, but no scout record — orphaned account
      return NextResponse.json(
        { error: "Scout profile not found. Contact the Quanta team." },
        { status: 404 }
      );
    }

    scoutId = scout.id;
    displayName = scout.full_name;
  }

  return NextResponse.json({
    role,
    user_id: data.user.id,
    email: data.user.email,
    display_name: displayName,
    scout_id: scoutId,
    redirect: role === "scout" ? "/scout" : "/inbox",
  });
}
