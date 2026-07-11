import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/services/audit-service";

const uuid = z.string().uuid();
const schema = z.discriminatedUnion("entity", [
  z.object({ entity: z.literal("department"), name: z.string().min(2), code: z.string().min(2).max(12) }),
  z.object({ entity: z.literal("programme"), departmentId: uuid, name: z.string().min(2), code: z.string().min(2).max(12), durationYears: z.coerce.number().int().min(1).max(10) }),
  z.object({ entity: z.literal("course"), programmeId: uuid, departmentId: uuid, code: z.string().min(2).max(16), title: z.string().min(2), creditHours: z.coerce.number().positive(), courseLevel: z.coerce.number().int().min(1).max(10) }),
  z.object({ entity: z.literal("period"), academicYear: z.string().min(4).max(20), semester: z.coerce.number().int().min(1).max(3), startDate: z.string().date(), endDate: z.string().date() }),
  z.object({ entity: z.literal("offering"), courseId: uuid, academicPeriodId: uuid, programmeId: uuid, yearOfStudy: z.coerce.number().int().min(1).max(10), registrationType: z.enum(["compulsory", "elective"]) }),
]);

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("system.configure");
  if (!auth.ok) return auth.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid setup data." }, { status: 422 });

  const admin = createSupabaseAdminClient();
  const value = parsed.data;
  let result: { data: { id: string } | null; error: { message: string } | null };

  switch (value.entity) {
    case "department":
      result = await admin.from("departments").insert({ name: value.name, code: value.code.toUpperCase() }).select("id").single();
      break;
    case "programme":
      result = await admin.from("programmes").insert({ department_id: value.departmentId, name: value.name, code: value.code.toUpperCase(), duration_years: value.durationYears, status: "active" }).select("id").single();
      break;
    case "course":
      result = await admin.from("courses").insert({ programme_id: value.programmeId, department_id: value.departmentId, code: value.code.toUpperCase(), title: value.title, credit_hours: value.creditHours, course_level: value.courseLevel, status: "active" }).select("id").single();
      break;
    case "period":
      if (value.endDate < value.startDate) return NextResponse.json({ error: "End date must be after the start date." }, { status: 422 });
      result = await admin.from("academic_periods").insert({ academic_year: value.academicYear, semester: value.semester, start_date: value.startDate, end_date: value.endDate, status: "planned", grading_open: false, results_published: false, registration_open: false }).select("id").single();
      break;
    case "offering":
      result = await admin.from("course_offerings").insert({ course_id: value.courseId, academic_period_id: value.academicPeriodId, programme_id: value.programmeId, year_of_study: value.yearOfStudy, registration_type: value.registrationType, status: "active" }).select("id").single();
      break;
  }

  if (result.error || !result.data) return NextResponse.json({ error: result.error?.message ?? "Unable to save academic setup." }, { status: 409 });
  await recordAuditEvent(auth.context.supabase, { actorProfileId: auth.context.profile.id, action: `admin.${value.entity}.created`, entityType: value.entity, entityId: result.data.id, newValues: value, userAgent: request.headers.get("user-agent") });
  return NextResponse.json({ message: `${value.entity[0].toUpperCase()}${value.entity.slice(1)} created.` }, { status: 201 });
}
