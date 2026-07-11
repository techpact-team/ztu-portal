import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/lib/auth/api";
import { recordAuditEvent } from "@/lib/services/audit-service";

const schema = z.object({ enrollmentId: z.string().uuid(), decision: z.enum(["confirm", "reject"]) });

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("enrolments.manage");
  if (!auth.ok) return auth.response;
  if (!auth.context.roles.includes("registrar")) return NextResponse.json({ error: "Only the Registrar can review submitted registrations." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid registration review." }, { status: 422 });
  const { data: enrollment } = await auth.context.supabase.from("enrollments").select("*").eq("id", parsed.data.enrollmentId).maybeSingle();
  if (!enrollment || enrollment.enrollment_status !== "submitted") return NextResponse.json({ error: "Only submitted registrations can be reviewed." }, { status: 409 });
  const status = parsed.data.decision === "confirm" ? "active" : "rejected";
  const { error } = await auth.context.supabase.from("enrollments").update({ enrollment_status: status }).eq("id", enrollment.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  await recordAuditEvent(auth.context.supabase, { actorProfileId: auth.context.profile.id, action: `registration.${status}`, entityType: "enrollment", entityId: enrollment.id, oldValues: enrollment, newValues: { enrollment_status: status }, userAgent: request.headers.get("user-agent") });
  return NextResponse.json({ message: `Registration ${status === "active" ? "confirmed" : "rejected"}.` });
}
