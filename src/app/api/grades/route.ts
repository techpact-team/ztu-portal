import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { gradeEntryBatchSchema } from "@/lib/validation/grade-schemas";
import type {
  AcademicPeriodRow,
  AssessmentRow,
  CourseOfferingRow,
  EnrollmentRow,
  GradeEntryRow,
} from "@/types/database";

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("grades.create_assigned");

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = gradeEntryBatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 422 });
  }

  const { data: assessmentData } = await auth.context.supabase
    .from("assessments")
    .select("*")
    .eq("id", parsed.data.assessmentId)
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

  if (parsed.data.grades.some((grade) => grade.rawScore > assessment.maximum_score)) {
    return NextResponse.json(
      { error: "A score exceeds the assessment maximum." },
      { status: 422 },
    );
  }

  const registrationNumbers = parsed.data.grades.map((grade) => grade.registrationNumber);
  if (new Set(registrationNumbers).size !== registrationNumbers.length) {
    return NextResponse.json({ error: "A registration number was included more than once." }, { status: 422 });
  }

  const { data: studentsData } = await auth.context.supabase
    .from("students")
    .select("*")
    .in("registration_number", registrationNumbers);
  const students = (studentsData ?? []) as import("@/types/database").StudentRow[];
  const studentByRegistration = new Map(students.map((student) => [student.registration_number, student]));

  if (students.length !== registrationNumbers.length) {
    return NextResponse.json({ error: "One or more student registration numbers were not found." }, { status: 422 });
  }

  const studentIds = students.map((student) => student.id);
  const { data: enrollmentData } = await auth.context.supabase
    .from("enrollments")
    .select("*")
    .eq("course_offering_id", assessment.course_offering_id)
    .in("student_id", studentIds);
  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];

  const invalidEnrollment = enrollments.some(
    (enrollment) => enrollment.course_offering_id !== assessment.course_offering_id,
  );

  if (invalidEnrollment || enrollments.length !== registrationNumbers.length) {
    return NextResponse.json({ error: "A student is not registered for this course offering." }, { status: 403 });
  }

  const enrollmentByStudent = new Map(enrollments.map((enrollment) => [enrollment.student_id, enrollment]));
  const resolvedGrades = parsed.data.grades.map((grade) => {
    const student = studentByRegistration.get(grade.registrationNumber);
    const enrollment = student ? enrollmentByStudent.get(student.id) : null;
    return { ...grade, enrollment };
  });

  if (resolvedGrades.some((grade) => !grade.enrollment)) {
    return NextResponse.json({ error: "A registration number is not enrolled in this course." }, { status: 403 });
  }

  const enrollmentIds = resolvedGrades.map((grade) => grade.enrollment!.id);

  const { data: existingGradeData } = await auth.context.supabase
    .from("grade_entries")
    .select("*")
    .eq("assessment_id", assessment.id)
    .in("enrollment_id", enrollmentIds);
  const existingGrades = (existingGradeData ?? []) as GradeEntryRow[];

  if (
    existingGrades.some((grade) =>
      ["submitted", "approved", "published", "correction_requested"].includes(
        grade.status,
      ),
    )
  ) {
    return NextResponse.json(
      { error: "Only draft or rejected grades can be edited." },
      { status: 409 },
    );
  }

  const upserts = resolvedGrades.map((grade) => ({
    assessment_id: assessment.id,
    enrollment_id: grade.enrollment!.id,
    raw_score: grade.rawScore,
    status: "draft",
    entered_by: auth.context.profile.id,
    updated_by: auth.context.profile.id,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await auth.context.supabase
    .from("grade_entries")
    .upsert(upserts, { onConflict: "assessment_id,enrollment_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  await recordAuditEvent(auth.context.supabase, {
    actorProfileId: auth.context.profile.id,
    action: "grades.draft_saved",
    entityType: "assessment",
    entityId: assessment.id,
    newValues: { count: upserts.length },
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ message: "Draft grades saved." });
}
