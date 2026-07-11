import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { changePasswordSchema } from "@/lib/validation/auth-schemas";

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("password.change_own");

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 422 });
  }

  const { error } = await auth.context.supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: "Password update failed." }, { status: 409 });
  }

  await recordAuditEvent(auth.context.supabase, {
    actorProfileId: auth.context.profile.id,
    action: "password.changed",
    entityType: "profile",
    entityId: auth.context.profile.id,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ message: "Password updated." });
}
