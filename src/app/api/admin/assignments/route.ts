import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/services/audit-service";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), courseOfferingId: z.string().uuid(), staffMemberId: z.string().uuid() }),
  z.object({ action: z.literal("remove"), assignmentId: z.string().uuid() }),
]);

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("courses.manage");
  if (!auth.ok) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid lecturer assignment." }, { status: 422 });
  const admin = createSupabaseAdminClient();

  if (parsed.data.action === "assign") {
    const { data, error } = await admin.from("lecturer_assignments").insert({ course_offering_id: parsed.data.courseOfferingId, staff_member_id: parsed.data.staffMemberId, assigned_by: auth.context.profile.id }).select("id").single();
    if (error || !data) return NextResponse.json({ error: error?.message ?? "Unable to assign lecturer." }, { status: 409 });
    await recordAuditEvent(auth.context.supabase, { actorProfileId: auth.context.profile.id, action: "lecturer.assigned", entityType: "lecturer_assignment", entityId: data.id, newValues: parsed.data, userAgent: request.headers.get("user-agent") });
    return NextResponse.json({ message: "Lecturer assigned." }, { status: 201 });
  }

  const { error } = await admin.from("lecturer_assignments").delete().eq("id", parsed.data.assignmentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  await recordAuditEvent(auth.context.supabase, { actorProfileId: auth.context.profile.id, action: "lecturer.unassigned", entityType: "lecturer_assignment", entityId: parsed.data.assignmentId, userAgent: request.headers.get("user-agent") });
  return NextResponse.json({ message: "Lecturer assignment removed." });
}
