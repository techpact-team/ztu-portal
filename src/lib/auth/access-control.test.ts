import { describe, expect, it } from "vitest";
import {
  canAccessPortal,
  canApproveGradeStatus,
  canEditGradeStatus,
  canPublishResultStatus,
  canSubmitGradeStatus,
  type AccessSnapshot,
} from "@/lib/auth/access-control";
import { permissionsForRoles } from "@/lib/permissions/permission-map";

const student: AccessSnapshot = {
  accountStatus: "active",
  roles: ["student"],
  permissions: permissionsForRoles(["student"]),
};

const lecturer: AccessSnapshot = {
  accountStatus: "active",
  roles: ["lecturer"],
  permissions: permissionsForRoles(["lecturer"]),
};

const hod: AccessSnapshot = {
  accountStatus: "active",
  roles: ["head_of_department"],
  permissions: permissionsForRoles(["head_of_department"]),
};

const registrar: AccessSnapshot = {
  accountStatus: "active",
  roles: ["registrar"],
  permissions: permissionsForRoles(["registrar"]),
};

const systemAdministrator: AccessSnapshot = {
  accountStatus: "active",
  roles: ["system_administrator"],
  permissions: permissionsForRoles(["system_administrator"]),
};

describe("access-control", () => {
  it("allows students into the student portal only", () => {
    expect(canAccessPortal(student, "student")).toBe(true);
    expect(canAccessPortal(student, "staff")).toBe(false);
  });

  it("blocks disabled accounts from every portal", () => {
    const disabled: AccessSnapshot = { ...student, accountStatus: "disabled" };

    expect(canAccessPortal(disabled, "student")).toBe(false);
    expect(canAccessPortal(disabled, "staff")).toBe(false);
  });

  it("allows lecturers to edit draft grades but not published grades", () => {
    expect(canEditGradeStatus(lecturer, "draft")).toBe(true);
    expect(canEditGradeStatus(lecturer, "published")).toBe(false);
  });

  it("allows lecturers to submit draft grades only", () => {
    expect(canSubmitGradeStatus(lecturer, "draft")).toBe(true);
    expect(canSubmitGradeStatus(lecturer, "approved")).toBe(false);
  });

  it("reserves final result approval for the Registrar", () => {
    expect(canApproveGradeStatus(registrar, "submitted")).toBe(true);
    expect(canApproveGradeStatus(registrar, "draft")).toBe(false);
    expect(canApproveGradeStatus(hod, "submitted")).toBe(false);
  });

  it("allows registrars to publish approved results only", () => {
    expect(canPublishResultStatus(registrar, "approved")).toBe(true);
    expect(canPublishResultStatus(registrar, "draft")).toBe(false);
  });

  it("keeps system administration separate from academic grade changes", () => {
    expect(canPublishResultStatus(systemAdministrator, "approved")).toBe(false);
    expect(canEditGradeStatus(systemAdministrator, "draft")).toBe(false);
  });
});
