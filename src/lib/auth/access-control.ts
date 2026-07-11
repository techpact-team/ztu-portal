import type { PermissionCode } from "@/lib/constants/permissions";
import type { RoleName } from "@/lib/constants/roles";
import { STAFF_ROLES } from "@/lib/constants/roles";
import type { GradeStatus } from "@/lib/constants/grade-status";

export type AccessSnapshot = {
  accountStatus: "active" | "pending" | "disabled";
  roles: RoleName[];
  permissions: PermissionCode[];
};

export function hasPermission(
  snapshot: AccessSnapshot,
  permission: PermissionCode,
) {
  return snapshot.permissions.includes(permission);
}

export function hasRole(snapshot: AccessSnapshot, role: RoleName) {
  return snapshot.roles.includes(role);
}

export function canAccessPortal(
  snapshot: AccessSnapshot,
  portal: "student" | "staff",
) {
  if (snapshot.accountStatus !== "active") {
    return false;
  }

  if (portal === "student") {
    return snapshot.roles.includes("student");
  }

  return snapshot.roles.some((role) => STAFF_ROLES.includes(role));
}

export function canEditGradeStatus(
  snapshot: AccessSnapshot,
  status: GradeStatus,
) {
  return (
    hasPermission(snapshot, "grades.update_draft_assigned") &&
    (status === "draft" || status === "rejected")
  );
}

export function canSubmitGradeStatus(
  snapshot: AccessSnapshot,
  status: GradeStatus,
) {
  return hasPermission(snapshot, "grades.submit_assigned") && status === "draft";
}

export function canApproveGradeStatus(
  snapshot: AccessSnapshot,
  status: GradeStatus,
) {
  return (
    hasPermission(snapshot, "grades.approve_department") &&
    status === "submitted"
  );
}

export function canPublishResultStatus(
  snapshot: AccessSnapshot,
  status: GradeStatus,
) {
  return hasPermission(snapshot, "results.publish") && status === "approved";
}
