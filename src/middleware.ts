import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const SCOUT_ROUTES = ["/scout", "/add-startup", "/startups", "/submissions", "/chat"];
const TEAM_ROUTES = ["/inbox", "/deals", "/scouts", "/queue", "/analytics"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: static files, auth pages, root login, API
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/" ||
    pathname.startsWith("/complete-signup") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Cron protection in production
  if (pathname.startsWith("/api/internal/scheduler")) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && !cronSecret.startsWith("TODO_") && process.env.NODE_ENV === "production") {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  // Create Supabase client that can refresh the session cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // No session — only block protected routes, allow demo mode through
  if (!user) {
    const isTeamRoute = TEAM_ROUTES.some((r) => pathname.startsWith(r));
    const isScoutRoute = SCOUT_ROUTES.some((r) => pathname.startsWith(r));

    // In development: let everything through (demo mode works without auth)
    if (process.env.NODE_ENV === "development") return response;

    // In production: enforce auth on protected routes
    if (isTeamRoute || isScoutRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  }

  // Session exists — get role and enforce route access
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = roleData?.role;

  const isTeamRoute = TEAM_ROUTES.some((r) => pathname.startsWith(r));
  const isScoutRoute = SCOUT_ROUTES.some((r) => pathname.startsWith(r));

  if (isTeamRoute && role !== "quanta" && role !== "admin") {
    return NextResponse.redirect(new URL("/scout", request.url));
  }

  if (isScoutRoute && role !== "scout") {
    return NextResponse.redirect(new URL("/inbox", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
