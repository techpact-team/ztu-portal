import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { ROLE_NAMES } from "@/lib/constants/roles";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), profileId: z.string().uuid(), status: z.enum(["active", "pending", "disabled"]) }),
  z.object({ action: z.literal("role"), profileId: z.string().uuid(), role: z.enum(ROLE_NAMES) }),
  z.object({ action: z.literal("reset"), profileId: z.string().uuid() }),
]);

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("users.create");
  if (!auth.ok) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid account action." }, { status: 422 });
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", parsed.data.profileId).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (parsed.data.action === "status") {
    const { error } = await admin.from("profiles").update({ account_status: parsed.data.status }).eq("id", profile.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  } else if (parsed.data.action === "role") {
    const { data: role } = await admin.from("roles").select("*").eq("name", parsed.data.role).single();
    if (!role) return NextResponse.json({ error: "Role not found." }, { status: 404 });
    await admin.from("user_roles").delete().eq("profile_id", profile.id);
    const { error } = await admin.from("user_roles").insert({ profile_id: profile.id, role_id: role.id, assigned_by: auth.context.profile.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  } else {
    const { error } = await admin.auth.resetPasswordForEmail(profile.email);
    if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  }

  await recordAuditEvent(auth.context.supabase, { actorProfileId: auth.context.profile.id, action: `account.${parsed.data.action}`, entityType: "profile", entityId: profile.id, newValues: parsed.data, userAgent: request.headers.get("user-agent") });
  return NextResponse.json({ message: parsed.data.action === "reset" ? "Password reset email sent." : "Account updated." });
}
