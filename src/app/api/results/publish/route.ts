import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { resultPublishSchema } from "@/lib/validation/grade-schemas";
import type { CourseResultRow } from "@/types/database";

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("results.publish");

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = resultPublishSchema.safeParse(body);

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

  if (result.result_status !== "approved") {
    return NextResponse.json(
      { error: "Only approved results can be published." },
      { status: 409 },
    );
  }

  const { error } = await auth.context.supabase
    .from("course_results")
    .update({
      result_status: "published",
      published_by: auth.context.profile.id,
      published_at: new Date().toISOString(),
    })
    .eq("id", result.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  await recordAuditEvent(auth.context.supabase, {
    actorProfileId: auth.context.profile.id,
    action: "results.published",
    entityType: "course_result",
    entityId: result.id,
    oldValues: result,
    newValues: { result_status: "published" },
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ message: "Result published." });
}
