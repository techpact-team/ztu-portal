import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { assertAssessmentWeightLimit } from "@/lib/services/grade-service";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { assessmentCreateSchema } from "@/lib/validation/assessment-schemas";
import type { AssessmentRow, CourseOfferingRow, AcademicPeriodRow } from "@/types/database";

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("assessments.create_assigned");

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = assessmentCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 422 });
  }

  const { data: assigned } = await auth.context.supabase.rpc("is_assigned_lecturer", {
    offering_id: parsed.data.courseOfferingId,
  });

  if (!assigned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: offeringData } = await auth.context.supabase
    .from("course_offerings")
    .select("*")
    .eq("id", parsed.data.courseOfferingId)
    .maybeSingle();
  const offering = offeringData as CourseOfferingRow | null;

  if (!offering) {
    return NextResponse.json({ error: "Course offering not found." }, { status: 404 });
  }

  const { data: periodData } = await auth.context.supabase
    .from("academic_periods")
    .select("*")
    .eq("id", offering.academic_period_id)
    .maybeSingle();
  const period = periodData as AcademicPeriodRow | null;

  if (!period?.grading_open) {
    return NextResponse.json(
      { error: "Grading is not open for this academic period." },
      { status: 409 },
    );
  }

  const { data: existingAssessments } = await auth.context.supabase
    .from("assessments")
    .select("*")
    .eq("course_offering_id", parsed.data.courseOfferingId);
  const currentWeight = ((existingAssessments ?? []) as AssessmentRow[]).reduce(
    (total, assessment) => total + assessment.weight_percentage,
    0,
  );

  try {
    assertAssessmentWeightLimit(currentWeight, parsed.data.weightPercentage);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Assessment weight invalid." },
      { status: 422 },
    );
  }

  const { data, error } = await auth.context.supabase
    .from("assessments")
    .insert({
      course_offering_id: parsed.data.courseOfferingId,
      name: parsed.data.name,
      assessment_type: parsed.data.assessmentType,
      maximum_score: parsed.data.maximumScore,
      weight_percentage: parsed.data.weightPercentage,
      status: "draft",
      created_by: auth.context.profile.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  await recordAuditEvent(auth.context.supabase, {
    actorProfileId: auth.context.profile.id,
    action: "assessment.created",
    entityType: "assessment",
    entityId: (data as AssessmentRow).id,
    newValues: data,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ message: "Assessment created." }, { status: 201 });
}
