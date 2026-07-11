import type { PermissionCode } from "@/lib/constants/permissions";
import type { RoleName } from "@/lib/constants/roles";

export const ROLE_PERMISSION_MATRIX: Record<RoleName, PermissionCode[]> = {
  student: [
    "profile.read_own",
    "courses.read_own",
    "assessments.read_own",
    "results.read_published_own",
    "notices.read",
    "password.change_own",
  ],
  lecturer: [
    "courses.read_assigned",
    "enrolments.read_assigned",
    "assessments.create_assigned",
    "assessments.update_assigned",
    "grades.create_assigned",
    "grades.update_draft_assigned",
    "grades.submit_assigned",
  ],
  head_of_department: [
    "courses.read_department",
    "grades.read_department",
  ],
  registrar: [
    "students.manage",
    "programmes.manage",
    "courses.manage",
    "enrolments.manage",
    "results.review",
    "grades.approve_department",
    "grades.reject_department",
    "results.publish",
    "grade_changes.approve",
    "academic_periods.manage",
  ],
  system_administrator: [
    "users.create",
    "users.disable",
    "roles.assign",
    "permissions.manage",
    "system.configure",
    "audit_logs.read",
    "students.manage",
    "programmes.manage",
    "courses.manage",
    "enrolments.manage",
    "academic_periods.manage",
  ],
};

export function permissionsForRoles(roles: RoleName[]): PermissionCode[] {
  return Array.from(
    new Set(roles.flatMap((role) => ROLE_PERMISSION_MATRIX[role] ?? [])),
  );
}
