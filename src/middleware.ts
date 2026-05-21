import { NextRequest, NextResponse } from "next/server";

// Route protection matrix
// In demo mode (no real auth): passes everything through
// When real Supabase Auth is wired: enforce role-based access

const SCOUT_ROUTES = ["/scout", "/add-startup", "/startups", "/submissions"];
const TEAM_ROUTES = ["/inbox", "/deals", "/scouts", "/queue", "/analytics"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, and auth pages
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/auth/") ||
    pathname === "/favicon.ico" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Cron job protection — require CRON_SECRET header
  if (pathname.startsWith("/api/internal/scheduler")) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow requests without the header in dev mode
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  // Demo / development: let everything through
  // TODO Phase 2: Replace with real Supabase session check
  // Example of what this will look like:
  //
  // const sessionCookie = request.cookies.get("sb-session");
  // if (!sessionCookie) {
  //   return NextResponse.redirect(new URL("/", request.url));
  // }
  //
  // const role = request.cookies.get("quanta-role")?.value;
  // if (pathname.startsWith("/inbox") && role !== "quanta") {
  //   return NextResponse.redirect(new URL("/scout", request.url));
  // }
  // if (pathname.startsWith("/scout") && role !== "scout") {
  //   return NextResponse.redirect(new URL("/inbox", request.url));
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
