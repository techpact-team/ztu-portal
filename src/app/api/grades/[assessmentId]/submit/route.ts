import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { upsertCourseResult } from "@/lib/services/result-service";
import type {
  AssessmentRow,
  CourseOfferingRow,
  EnrollmentRow,
  GradeEntryRow,
} from "@/types/database";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ assessmentId: string }> },
) {
  const auth = await requireApiPermission("grades.submit_assigned");

  if (!auth.ok) {
    return auth.response;
  }

  const { assessmentId } = await context.params;
  const { data: assessmentData } = await auth.context.supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .maybeSingle();
  const assessment = assessmentData as AssessmentRow | null;

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }

  const { data: assigned } = await auth.context.supabase.rpc("is_assigned_lecturer", {
    offering_id: assessment.course_offering_id,
  });

  if (!assigned) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: offeringData } = await auth.context.supabase
    .from("course_offerings")
    .select("*")
    .eq("id", assessment.course_offering_id)
    .maybeSingle();
  const offering = offeringData as CourseOfferingRow | null;

  if (!offering) {
    return NextResponse.json({ error: "Course offering not found." }, { status: 404 });
  }

  const [{ data: allAssessmentData }, { data: enrollmentData }] = await Promise.all([
    auth.context.supabase
      .from("assessments")
      .select("*")
      .eq("course_offering_id", offering.id),
    auth.context.supabase
      .from("enrollments")
      .select("*")
      .eq("course_offering_id", offering.id),
  ]);

  const assessments = (allAssessmentData ?? []) as AssessmentRow[];
  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
  const enrollmentIds = enrollments.map((enrollment) => enrollment.id);
  const assessmentIds = assessments.map((item) => item.id);
  const { data: gradeData } =
    enrollmentIds.length > 0 && assessmentIds.length > 0
      ? await auth.context.supabase
          .from("grade_entries")
          .select("*")
          .in("enrollment_id", enrollmentIds)
          .in("assessment_id", assessmentIds)
      : { data: [] };

  const grades = (gradeData ?? []) as GradeEntryRow[];

  if (grades.length === 0) {
    return NextResponse.json({ error: "No draft grades to submit." }, { status: 409 });
  }

  const { error: updateError } = await auth.context.supabase
    .from("grade_entries")
    .update({ status: "submitted", updated_by: auth.context.profile.id, updated_at: new Date().toISOString() })
    .eq("assessment_id", assessment.id)
    .eq("status", "draft");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 409 });
  }

  await Promise.all(
    enrollments.map((enrollment) =>
      upsertCourseResult({
        enrollmentId: enrollment.id,
        assessments,
        grades: grades.filter((grade) => grade.enrollment_id === enrollment.id),
        supabase: auth.context.supabase,
        submittedBy: auth.context.profile.id,
      }),
    ),
  );

  await recordAuditEvent(auth.context.supabase, {
    actorProfileId: auth.context.profile.id,
    action: "grades.submitted",
    entityType: "assessment",
    entityId: assessment.id,
    newValues: { gradeCount: grades.length },
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ message: "Grades submitted for approval." });
}
