import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AcademicPeriodRow,
  CourseOfferingRow,
  CourseRow,
  DepartmentRow,
  LecturerAssignmentRow,
  ProfileRow,
  ProgrammeRow,
  RoleRow,
  StaffMemberRow,
  StudentRow,
  UserRoleRow,
} from "@/types/database";

export type AdminAccountView = ProfileRow & {
  roles: string[];
  registrationNumber: string | null;
  staffNumber: string | null;
};

export type AdminOfferingView = CourseOfferingRow & {
  courseLabel: string;
  programmeLabel: string;
  periodLabel: string;
};

export type AdminStaffView = StaffMemberRow & {
  name: string;
};

export type AdminStudentView = StudentRow & {
  name: string;
  email: string;
  programmeLabel: string;
};

export type AdminAssignmentView = LecturerAssignmentRow & {
  lecturerName: string;
  staffNumber: string;
  offeringLabel: string;
};

export type AdminPortalData = {
  accounts: AdminAccountView[];
  departments: DepartmentRow[];
  programmes: ProgrammeRow[];
  courses: CourseRow[];
  periods: AcademicPeriodRow[];
  offerings: AdminOfferingView[];
  staff: AdminStaffView[];
  students: AdminStudentView[];
  assignments: AdminAssignmentView[];
  roles: RoleRow[];
};

function mapById<T extends { id: string }>(rows: T[]) {
  return new Map(rows.map((row) => [row.id, row]));
}

export async function getAdminPortalData(): Promise<AdminPortalData> {
  const admin = createSupabaseAdminClient();
  const [
    { data: profileData }, { data: roleData }, { data: userRoleData },
    { data: departmentData }, { data: programmeData }, { data: courseData },
    { data: periodData }, { data: offeringData }, { data: studentData },
    { data: staffData }, { data: assignmentData },
  ] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.from("roles").select("*").order("display_name"),
    admin.from("user_roles").select("*"),
    admin.from("departments").select("*").order("name"),
    admin.from("programmes").select("*").order("name"),
    admin.from("courses").select("*").order("code"),
    admin.from("academic_periods").select("*").order("academic_year", { ascending: false }),
    admin.from("course_offerings").select("*").order("id", { ascending: false }),
    admin.from("students").select("*").order("registration_number"),
    admin.from("staff_members").select("*").order("staff_number"),
    admin.from("lecturer_assignments").select("*").order("assigned_at", { ascending: false }),
  ]);

  const profiles = (profileData ?? []) as ProfileRow[];
  const roles = (roleData ?? []) as RoleRow[];
  const userRoles = (userRoleData ?? []) as UserRoleRow[];
  const departments = (departmentData ?? []) as DepartmentRow[];
  const programmes = (programmeData ?? []) as ProgrammeRow[];
  const courses = (courseData ?? []) as CourseRow[];
  const periods = (periodData ?? []) as AcademicPeriodRow[];
  const offerings = (offeringData ?? []) as CourseOfferingRow[];
  const students = (studentData ?? []) as StudentRow[];
  const staff = (staffData ?? []) as StaffMemberRow[];
  const assignments = (assignmentData ?? []) as LecturerAssignmentRow[];

  const profileById = mapById(profiles);
  const roleById = mapById(roles);
  const programmeById = mapById(programmes);
  const courseById = mapById(courses);
  const periodById = mapById(periods);
  const offeringById = mapById(offerings);
  const staffById = mapById(staff);
  const studentByProfile = new Map(students.map((student) => [student.profile_id, student]));
  const staffByProfile = new Map(staff.map((member) => [member.profile_id, member]));
  const roleNamesByProfile = new Map<string, string[]>();

  for (const userRole of userRoles) {
    const role = roleById.get(userRole.role_id);
    if (!role) continue;
    roleNamesByProfile.set(userRole.profile_id, [...(roleNamesByProfile.get(userRole.profile_id) ?? []), role.name]);
  }

  const offeringViews: AdminOfferingView[] = offerings.map((offering) => {
    const course = courseById.get(offering.course_id);
    const programme = offering.programme_id ? programmeById.get(offering.programme_id) : null;
    const period = periodById.get(offering.academic_period_id);
    return {
      ...offering,
      courseLabel: course ? `${course.code} — ${course.title}` : "Unknown course",
      programmeLabel: programme?.name ?? "No programme",
      periodLabel: period ? `${period.academic_year} · Semester ${period.semester}` : "Unknown period",
    };
  });

  return {
    accounts: profiles.map((profile) => ({
      ...profile,
      roles: roleNamesByProfile.get(profile.id) ?? [],
      registrationNumber: studentByProfile.get(profile.id)?.registration_number ?? null,
      staffNumber: staffByProfile.get(profile.id)?.staff_number ?? null,
    })),
    departments,
    programmes,
    courses,
    periods,
    offerings: offeringViews,
    staff: staff.filter((member) => (roleNamesByProfile.get(member.profile_id) ?? []).includes("lecturer")).map((member) => ({
      ...member,
      name: profileById.has(member.profile_id)
        ? `${profileById.get(member.profile_id)!.first_name} ${profileById.get(member.profile_id)!.last_name}`
        : "Unknown staff member",
    })),
    students: students.map((student) => ({
      ...student,
      name: profileById.has(student.profile_id)
        ? `${profileById.get(student.profile_id)!.first_name} ${profileById.get(student.profile_id)!.last_name}`
        : "Unknown student",
      email: profileById.get(student.profile_id)?.email ?? "",
      programmeLabel: programmeById.get(student.programme_id)?.name ?? "Unknown programme",
    })),
    assignments: assignments.map((assignment) => {
      const lecturer = staffById.get(assignment.staff_member_id);
      const profile = lecturer ? profileById.get(lecturer.profile_id) : null;
      const offering = offeringById.get(assignment.course_offering_id);
      const course = offering ? courseById.get(offering.course_id) : null;
      const period = offering ? periodById.get(offering.academic_period_id) : null;
      return {
        ...assignment,
        lecturerName: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown lecturer",
        staffNumber: lecturer?.staff_number ?? "Unknown",
        offeringLabel: `${course?.code ?? "Course"} · ${period?.academic_year ?? "Period"} S${period?.semester ?? ""}`,
      };
    }),
    roles,
  };
}
