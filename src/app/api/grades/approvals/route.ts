import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { gradeApprovalSchema } from "@/lib/validation/grade-schemas";
import type { CourseResultRow } from "@/types/database";

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("results.review");

  if (!auth.ok) {
    return auth.response;
  }

  if (!auth.context.roles.includes("registrar")) {
    return NextResponse.json({ error: "Only the Registrar can approve final results." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = gradeApprovalSchema.safeParse(body);

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

  if (result.result_status !== "submitted") {
    return NextResponse.json(
      { error: "Only submitted results can be approved or rejected." },
      { status: 409 },
    );
  }

  const nextStatus = parsed.data.decision === "approve" ? "approved" : "rejected";
  const { error } = await auth.context.supabase
    .from("course_results")
    .update({
      result_status: nextStatus,
      approved_by: parsed.data.decision === "approve" ? auth.context.profile.id : null,
      approved_at: parsed.data.decision === "approve" ? new Date().toISOString() : null,
    })
    .eq("id", result.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  await recordAuditEvent(auth.context.supabase, {
    actorProfileId: auth.context.profile.id,
    action: parsed.data.decision === "approve" ? "grades.approved" : "grades.rejected",
    entityType: "course_result",
    entityId: result.id,
    oldValues: result,
    newValues: { result_status: nextStatus },
    reason: parsed.data.reason ?? null,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ message: `Result ${nextStatus}.` });
}
