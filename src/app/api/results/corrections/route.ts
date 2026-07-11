import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { hasPermission } from "@/lib/auth/access-control";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { gradeCorrectionRequestSchema } from "@/lib/validation/grade-schemas";
import type { CourseResultRow } from "@/types/database";

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission();

  if (!auth.ok) {
    return auth.response;
  }

  const canRequest =
    hasPermission(
      {
        accountStatus: auth.context.profile.accountStatus,
        roles: auth.context.roles,
        permissions: auth.context.permissions,
      },
      "grades.submit_assigned",
    ) ||
    hasPermission(
      {
        accountStatus: auth.context.profile.accountStatus,
        roles: auth.context.roles,
        permissions: auth.context.permissions,
      },
      "results.review",
    );

  if (!canRequest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = gradeCorrectionRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 422 });
  }

  const { data: resultData } = await auth.context.supabase
    .from("course_results")
    .select("*")
    .eq("id", parsed.data.courseResultId)
    .maybeSingle();
  const result = resultData as CourseResultRow | null;

  if (!result) {
    return NextResponse.json({ error: "Result not found." }, { status: 404 });
  }

  if (result.result_status !== "published" || result.final_score === null) {
    return NextResponse.json(
      { error: "Only published results can enter correction flow." },
      { status: 409 },
    );
  }

  const { data, error } = await auth.context.supabase
    .from("grade_change_requests")
    .insert({
      course_result_id: result.id,
      requested_by: auth.context.profile.id,
      old_score: result.final_score,
      requested_score: parsed.data.requestedScore,
      reason: parsed.data.reason,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  await auth.context.supabase
    .from("course_results")
    .update({ result_status: "correction_requested" })
    .eq("id", result.id);

  await recordAuditEvent(auth.context.supabase, {
    actorProfileId: auth.context.profile.id,
    action: "grade_correction.requested",
    entityType: "grade_change_request",
    entityId: data.id,
    oldValues: { final_score: result.final_score },
    newValues: { requested_score: parsed.data.requestedScore },
    reason: parsed.data.reason,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ message: "Correction request submitted." }, { status: 201 });
}
