import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { isSupabaseConfigured } from "@/lib/env";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth-schemas";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function logLogin(action: string, email: string | null, ipAddress: string, userAgent: string | null, actorProfileId?: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("audit_logs").insert({ actor_profile_id: actorProfileId ?? null, action, entity_type: "authentication", new_values: email ? { email } : null, ip_address: ipAddress, user_agent: userAgent });

    if (error) {
      console.error("Unable to record authentication audit event:", error.message);
    }
  } catch (error) {
    // Audit logging must never prevent a user from authenticating. This also
    // keeps login available when the optional service-role key is not present.
    console.error(
      "Unable to initialize authentication audit logging:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}

export async function POST(request: NextRequest) {
  const browserNavigation = request.headers
    .get("content-type")
    ?.includes("application/x-www-form-urlencoded");
  const loginUrl = new URL("/student/login", request.url);

  function errorResponse(error: string, status: number, portal?: string) {
    if (!browserNavigation) {
      return NextResponse.json({ error }, { status });
    }

    loginUrl.pathname = portal === "staff" ? "/staff/login" : "/student/login";
    loginUrl.searchParams.set("error", error);
    return NextResponse.redirect(loginUrl, 303);
  }

  if (!isSupabaseConfigured()) {
    return errorResponse("Supabase is not configured.", 503);
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const rateLimit = checkRateLimit(`login:${ipAddress}`, 8, 60_000);

  if (!rateLimit.allowed) {
    await logLogin("login.rate_limited", null, ipAddress, request.headers.get("user-agent"));
    return errorResponse("Too many login attempts. Try again shortly.", 429);
  }

  const body = browserNavigation
    ? Object.fromEntries(await request.formData())
    : await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      "Check the highlighted fields and try again.",
      422,
      typeof body === "object" && body && "portal" in body
        ? String(body.portal)
        : undefined,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    await logLogin("login.failed", parsed.data.email, ipAddress, request.headers.get("user-agent"));
    return errorResponse("Invalid email or password.", 401, parsed.data.portal);
  }

  const auth = await getAuthContext();

  if (auth.status !== "ok") {
    await logLogin("login.inactive_account", parsed.data.email, ipAddress, request.headers.get("user-agent"));
    await supabase.auth.signOut();
    return errorResponse("Account is not active.", 403, parsed.data.portal);
  }

  const staffRole = auth.context.roles.some((role) => role !== "student");

  if (parsed.data.portal === "student" && !auth.context.roles.includes("student")) {
    await logLogin("login.wrong_portal", parsed.data.email, ipAddress, request.headers.get("user-agent"), auth.context.profile.id);
    await supabase.auth.signOut();
    return errorResponse("Use the staff portal for this account.", 403, parsed.data.portal);
  }

  if (parsed.data.portal === "staff" && !staffRole) {
    await logLogin("login.wrong_portal", parsed.data.email, ipAddress, request.headers.get("user-agent"), auth.context.profile.id);
    await supabase.auth.signOut();
    return errorResponse("Use the student portal for this account.", 403, parsed.data.portal);
  }

  await logLogin("login.success", parsed.data.email, ipAddress, request.headers.get("user-agent"), auth.context.profile.id);

  const redirectTo =
    parsed.data.portal === "student" ? "/student/dashboard" : "/staff/dashboard";

  if (browserNavigation) {
    return NextResponse.redirect(new URL(redirectTo, request.url), 303);
  }

  return NextResponse.json({ redirectTo });
}
