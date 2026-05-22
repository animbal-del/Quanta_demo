import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const SCOUT_ROUTES = ["/scout", "/add-startup", "/startups", "/submissions", "/chat", "/account", "/dashboard"];
const TEAM_ROUTES  = ["/inbox", "/deals", "/scouts", "/queue", "/analytics", "/profile"];
const PUBLIC_ROUTES = ["/", "/complete-signup", "/auth"];

function isScoutRoute(p: string)  { return SCOUT_ROUTES.some((r) => p === r || p.startsWith(r + "/")); }
function isTeamRoute(p: string)   { return TEAM_ROUTES.some((r) => p === r || p.startsWith(r + "/")); }
function isPublicRoute(p: string) { return PUBLIC_ROUTES.some((r) => p === r || p.startsWith(r + "/")); }

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/") ||
    isPublicRoute(pathname)
  ) {
    return NextResponse.next();
  }

  // Check Supabase session
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // No session — redirect to login
    if (isScoutRoute(pathname) || isTeamRoute(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return response;
  }

  // Session exists — enforce role-based routing
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = roleData?.role;

  if (isTeamRoute(pathname) && role !== "quanta" && role !== "admin") {
    return NextResponse.redirect(new URL("/scout", request.url));
  }
  if (isScoutRoute(pathname) && role !== "scout") {
    return NextResponse.redirect(new URL("/inbox", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
