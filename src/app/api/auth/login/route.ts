import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Invalid credentials" }, { status: 401 });
  }

  // Get user role from user_roles table
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .single();

  const role = roleData?.role ?? null;

  // Get scout record if scout role
  let scoutId: string | null = null;
  let displayName: string = email;

  if (role === "scout") {
    const { data: scout } = await supabase
      .from("scouts")
      .select("id, full_name")
      .eq("supabase_user_id", data.user.id)
      .single();
    if (scout) { scoutId = scout.id; displayName = scout.full_name; }
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
