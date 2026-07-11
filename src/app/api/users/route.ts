import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { recordAuditEvent } from "@/lib/services/audit-service";
import { userCreateSchema } from "@/lib/validation/admin-schemas";

export async function POST(request: NextRequest) {
  const auth = await requireApiPermission("users.create");

  if (!auth.ok) {
    return auth.response;
  }

  const body = await request.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed." }, { status: 422 });
  }

  const isStudent = parsed.data.role === "student";
  if (isStudent && (!parsed.data.registrationNumber || !parsed.data.programmeId)) {
    return NextResponse.json({ error: "Student accounts require a registration number and programme." }, { status: 422 });
  }
  if (!isStudent && !parsed.data.staffNumber) {
    return NextResponse.json({ error: "Staff accounts require a staff number." }, { status: 422 });
  }

  const admin = createSupabaseAdminClient();
  const { data: invitation, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
      },
    });

  if (inviteError || !invitation.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Unable to invite user." },
      { status: 409 },
    );
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: invitation.user.id,
      first_name: parsed.data.firstName,
      middle_name: parsed.data.middleName ?? null,
      last_name: parsed.data.lastName,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      account_status: "pending",
    })
    .select("*")
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: profileError?.message ?? "Unable to create profile." },
      { status: 409 },
    );
  }

  const { data: role } = await admin
    .from("roles")
    .select("*")
    .eq("name", parsed.data.role)
    .single();

  if (role) {
    await admin.from("user_roles").insert({
      profile_id: profile.id,
      role_id: role.id,
      assigned_by: auth.context.profile.id,
    });
  }


  const academicRecord = isStudent
    ? await admin.from("students").insert({
        profile_id: profile.id,
        registration_number: parsed.data.registrationNumber!,
        programme_id: parsed.data.programmeId!,
        year_of_study: 1,
        admission_date: new Date().toISOString().slice(0, 10),
        student_status: "active",
      })
    : await admin.from("staff_members").insert({
        profile_id: profile.id,
        staff_number: parsed.data.staffNumber!,
        department_id: parsed.data.departmentId ?? null,
        job_title: parsed.data.role.replaceAll("_", " "),
        staff_status: "active",
      });

  if (academicRecord.error) {
    await admin.from("profiles").delete().eq("id", profile.id);
    await admin.auth.admin.deleteUser(invitation.user.id);
    return NextResponse.json({ error: academicRecord.error.message }, { status: 409 });
  }

  await recordAuditEvent(auth.context.supabase, {
    actorProfileId: auth.context.profile.id,
    action: "user.created",
    entityType: "profile",
    entityId: profile.id,
    newValues: { email: parsed.data.email, role: parsed.data.role, registrationNumber: parsed.data.registrationNumber, staffNumber: parsed.data.staffNumber },
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ message: "User invitation created." }, { status: 201 });
}
