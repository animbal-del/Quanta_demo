import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") ?? "team";
  const validRole = role === "scout" ? "scout" : "quanta";

  const response = NextResponse.json({ success: true, role: validRole });

  // Set demo cookies — 8-hour session
  const maxAge = 8 * 60 * 60;
  response.cookies.set("quanta_demo_role", validRole, { maxAge, path: "/" });

  if (validRole === "scout") {
    response.cookies.set("quanta_scout_id", "11111111-1111-1111-1111-111111111111", { maxAge, path: "/" });
  }

  return response;
}
