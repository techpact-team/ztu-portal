import { NextResponse, type NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import type { CourseOfferingRow, StudentRow } from "@/types/database";

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (auth.status !== "ok") return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  if (!auth.context.roles.includes("student")) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await request.json().catch(() => null) as { offeringIds?: unknown } | null;
  if (!Array.isArray(body?.offeringIds) || body.offeringIds.length === 0 || body.offeringIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Select at least one course." }, { status: 422 });
  }

  const { data: studentData } = await auth.context.supabase.from("students").select("*").eq("profile_id", auth.context.profile.id).maybeSingle();
  const student = studentData as StudentRow | null;
  if (!student || student.student_status !== "active") return NextResponse.json({ error: "Your student account is not academically active." }, { status: 409 });

  const ids = Array.from(new Set(body.offeringIds as string[]));
  const { data: offeringsData } = await auth.context.supabase.from("course_offerings").select("*").in("id", ids);
  const offerings = (offeringsData ?? []) as CourseOfferingRow[];
  if (offerings.length !== ids.length || offerings.some((item) => item.status !== "active" || item.programme_id !== student.programme_id || item.year_of_study !== student.year_of_study)) {
    return NextResponse.json({ error: "One or more courses are not available for your programme and year." }, { status: 409 });
  }

  const periodIds = Array.from(new Set(offerings.map((item) => item.academic_period_id)));
  const { data: periods } = await auth.context.supabase
    .from("academic_periods")
    .select("*")
    .in("id", periodIds)
    .eq("status", "active")
    .eq("registration_open", true);
  const today = new Date().toISOString().slice(0, 10);
  if ((periods ?? []).length !== periodIds.length || (periods ?? []).some((period) => period.registration_deadline && period.registration_deadline < today)) {
    return NextResponse.json({ error: "Course registration is closed or the deadline has passed." }, { status: 409 });
  }

  const { data: existingRows } = await auth.context.supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", student.id)
    .in("course_offering_id", ids);
  const existingByOffering = new Map((existingRows ?? []).map((row) => [row.course_offering_id, row]));
  const blocked = [...existingByOffering.values()].find((row) => row.enrollment_status !== "rejected");
  if (blocked) return NextResponse.json({ error: "A selected course is already registered or awaiting review." }, { status: 409 });

  const rejectedIds = [...existingByOffering.values()].map((row) => row.id);
  const newOfferingIds = ids.filter((id) => !existingByOffering.has(id));
  const [{ error: resubmitError }, { error }] = await Promise.all([
    rejectedIds.length
      ? auth.context.supabase.from("enrollments").update({ enrollment_status: "submitted", enrolled_at: new Date().toISOString() }).in("id", rejectedIds)
      : Promise.resolve({ error: null }),
    newOfferingIds.length
      ? auth.context.supabase.from("enrollments").insert(newOfferingIds.map((courseOfferingId) => ({ student_id: student.id, course_offering_id: courseOfferingId, enrollment_status: "submitted" })))
      : Promise.resolve({ error: null }),
  ]);
  const writeError = resubmitError ?? error;
  if (writeError) return NextResponse.json({ error: writeError.code === "23505" ? "A selected course is already registered." : writeError.message }, { status: 409 });
  return NextResponse.json({ message: `${ids.length} course${ids.length === 1 ? "" : "s"} submitted for Registrar confirmation.` }, { status: 201 });
}
