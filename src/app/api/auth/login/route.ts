import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const DEMO_TEAM_EMAIL = "team@quanta.vc";
const DEMO_SCOUT_EMAIL = "amit@scout.quanta.vc";

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
  if (m.includes("invalid api key") || m.includes("api key"))
    return "Supabase is misconfigured. Use the demo account or update the Supabase environment keys.";

  // Catch-all: return the original but capitalised
  return message.charAt(0).toUpperCase() + message.slice(1);
}

function isValidSupabasePublicKey(value: string | undefined): value is string {
  if (!value || value.startsWith("TODO_")) return false;
  if (value.startsWith("sb_publishable_")) return true;
  return value.split(".").length === 3;
}

function createDemoLoginResponse(role: "quanta" | "scout") {
  const response = NextResponse.json({
    role,
    user_id: null,
    email: role === "quanta" ? DEMO_TEAM_EMAIL : DEMO_SCOUT_EMAIL,
    display_name: role === "quanta" ? "Quanta Team" : "Amit Sharma",
    scout_id: role === "scout" ? "11111111-1111-1111-1111-111111111111" : null,
    redirect: role === "scout" ? "/scout" : "/inbox",
    is_demo: true,
  });

  const maxAge = 8 * 60 * 60;
  response.cookies.set("quanta_demo_role", role, { maxAge, path: "/" });

  if (role === "scout") {
    response.cookies.set("quanta_scout_id", "11111111-1111-1111-1111-111111111111", {
      maxAge,
      path: "/",
    });
  }

  return response;
}

export async function POST(req: NextRequest) {
  // 1. Validate body
  let email: string, password: string, requestedRole: string | undefined;
  try {
    ({ email, password, role: requestedRole } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email?.trim())    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!password?.trim()) return NextResponse.json({ error: "Password is required." }, { status: 400 });

  const normalizedEmail = email.trim().toLowerCase();

  // Demo accounts must work even when Supabase is not configured on Vercel.
  if (normalizedEmail === DEMO_TEAM_EMAIL) {
    return createDemoLoginResponse("quanta");
  }

  if (normalizedEmail === DEMO_SCOUT_EMAIL) {
    return createDemoLoginResponse("scout");
  }

  // 2. Check env vars are present (catches Vercel missing-var deploys)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !isValidSupabasePublicKey(supabaseAnonKey)) {
    if (requestedRole === "scout") {
      return createDemoLoginResponse("scout");
    }

    console.error("[login] Supabase env vars missing or invalid");
    return NextResponse.json(
      { error: "Supabase is misconfigured. Use the demo account or update the Supabase environment keys." },
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  // 3. Sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
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

  // Clear any leftover demo cookies so real session takes priority
  const response = NextResponse.json({
    role,
    user_id: data.user.id,
    email: data.user.email,
    display_name: displayName,
    scout_id: scoutId,
    redirect: role === "scout" ? "/scout" : "/inbox",
  });
  response.cookies.delete("quanta_demo_role");
  response.cookies.delete("quanta_scout_id");
  return response;
}
