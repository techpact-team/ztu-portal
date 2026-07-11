import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { resolveGrade } from "@/lib/services/grade-service";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { gradeCorrectionApprovalSchema } from "@/lib/validation/grade-schemas";
import type { CourseResultRow, GradeChangeRequestRow } from "@/types/database";

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("grade_changes.approve");

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = gradeCorrectionApprovalSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 422 });
  }

  const { data: requestData } = await auth.context.supabase
    .from("grade_change_requests")
    .select("*")
    .eq("id", parsed.data.requestId)
    .maybeSingle();
  const correctionRequest = requestData as GradeChangeRequestRow | null;

  if (!correctionRequest) {
    return NextResponse.json({ error: "Correction request not found." }, { status: 404 });
  }

  if (correctionRequest.status !== "pending") {
    return NextResponse.json(
      { error: "Correction request has already been reviewed." },
      { status: 409 },
    );
  }

  const { data: resultData } = await auth.context.supabase
    .from("course_results")
    .select("*")
    .eq("id", correctionRequest.course_result_id)
    .maybeSingle();
  const result = resultData as CourseResultRow | null;

  if (!result) {
    return NextResponse.json({ error: "Result not found." }, { status: 404 });
  }

  const reviewedAt = new Date().toISOString();
  await auth.context.supabase
    .from("grade_change_requests")
    .update({
      status: parsed.data.decision === "approve" ? "approved" : "rejected",
      reviewed_by: auth.context.profile.id,
      reviewed_at: reviewedAt,
    })
    .eq("id", correctionRequest.id);

  if (parsed.data.decision === "approve") {
    const grade = resolveGrade(correctionRequest.requested_score);
    await auth.context.supabase
      .from("course_results")
      .update({
        final_score: correctionRequest.requested_score,
        letter_grade: grade.letterGrade,
        grade_point: grade.gradePoint,
        result_status: "published",
        published_by: auth.context.profile.id,
        published_at: reviewedAt,
      })
      .eq("id", result.id);
  }

  await recordAuditEvent(auth.context.supabase, {
    actorProfileId: auth.context.profile.id,
    action:
      parsed.data.decision === "approve"
        ? "grade_correction.approved"
        : "grade_correction.rejected",
    entityType: "grade_change_request",
    entityId: correctionRequest.id,
    oldValues: result,
    newValues:
      parsed.data.decision === "approve"
        ? { final_score: correctionRequest.requested_score }
        : { status: "rejected" },
    reason: correctionRequest.reason,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ message: "Correction request reviewed." });
}
