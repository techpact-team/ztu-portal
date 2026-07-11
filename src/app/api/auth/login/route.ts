import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { isSupabaseConfigured } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth-schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function logLogin(action: string, email: string | null, ipAddress: string, userAgent: string | null, actorProfileId?: string) {
  const admin = createSupabaseAdminClient();
  await admin.from("audit_logs").insert({ actor_profile_id: actorProfileId ?? null, action, entity_type: "authentication", new_values: email ? { email } : null, ip_address: ipAddress, user_agent: userAgent });
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503 },
    );
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rateLimit = checkRateLimit(`login:${ipAddress}`, 8, 60_000);

  if (!rateLimit.allowed) {
    await logLogin("login.rate_limited", null, ipAddress, request.headers.get("user-agent"));
    return NextResponse.json(
      { error: "Too many login attempts. Try again shortly." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the highlighted fields and try again." },
      { status: 422 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await logLogin("login.failed", parsed.data.email, ipAddress, request.headers.get("user-agent"));
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const auth = await getAuthContext();

  if (auth.status !== "ok") {
    await logLogin("login.inactive_account", parsed.data.email, ipAddress, request.headers.get("user-agent"));
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Account is not active." }, { status: 403 });
  }

  const staffRole = auth.context.roles.some((role) => role !== "student");

  if (parsed.data.portal === "student" && !auth.context.roles.includes("student")) {
    await logLogin("login.wrong_portal", parsed.data.email, ipAddress, request.headers.get("user-agent"), auth.context.profile.id);
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Use the staff portal for this account." }, { status: 403 });
  }

  if (parsed.data.portal === "staff" && !staffRole) {
    await logLogin("login.wrong_portal", parsed.data.email, ipAddress, request.headers.get("user-agent"), auth.context.profile.id);
    await supabase.auth.signOut();
    return NextResponse.json({ error: "Use the student portal for this account." }, { status: 403 });
  }

  await logLogin("login.success", parsed.data.email, ipAddress, request.headers.get("user-agent"), auth.context.profile.id);

  return NextResponse.json({
    redirectTo: parsed.data.portal === "student" ? "/student/dashboard" : "/staff/dashboard",
  });
}
