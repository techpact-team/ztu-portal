import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/services/audit-service";

const schema = z.object({ studentId: z.string().uuid(), programmeId: z.string().uuid(), yearOfStudy: z.coerce.number().int().min(1).max(10), status: z.enum(["active", "suspended", "withdrawn", "completed", "graduated"]) });

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("students.manage");
  if (!auth.ok) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid student setup." }, { status: 422 });
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("students").update({ programme_id: parsed.data.programmeId, year_of_study: parsed.data.yearOfStudy, student_status: parsed.data.status }).eq("id", parsed.data.studentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  await recordAuditEvent(auth.context.supabase, { actorProfileId: auth.context.profile.id, action: "student.academic_setup_updated", entityType: "student", entityId: parsed.data.studentId, newValues: parsed.data, userAgent: request.headers.get("user-agent") });
  return NextResponse.json({ message: "Student academic setup updated." });
}
