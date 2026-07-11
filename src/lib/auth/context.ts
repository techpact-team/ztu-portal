import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { permissionsForRoles } from "@/lib/permissions/permission-map";
import type { PermissionCode } from "@/lib/constants/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import type { RoleName } from "@/lib/constants/roles";
import { ROLE_NAMES } from "@/lib/constants/roles";
import type { AuthContext, AuthProfile } from "@/types/auth";
import type { Database } from "@/types/database";

type PermissionRelation = {
  permissions: { code: string } | null;
};

type RoleRelation = {
  name: string;
  role_permissions?: PermissionRelation[] | null;
};

type UserRoleRelation = {
  roles: RoleRelation | null;
};

type ProfileQueryRow = {
  id: string;
  auth_user_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  account_status: string;
  user_roles?: UserRoleRelation[] | null;
};

export type AuthContextResult =
  | { status: "not_configured" }
  | { status: "unauthenticated" }
  | { status: "profile_missing"; supabase: SupabaseClient<Database> }
  | { status: "inactive"; supabase: SupabaseClient<Database> }
  | { status: "ok"; context: AuthContext };

function toRoleName(role: string): RoleName | null {
  return ROLE_NAMES.includes(role as RoleName) ? (role as RoleName) : null;
}

function toPermissionCode(permission: string): PermissionCode | null {
  return PERMISSIONS.includes(permission as PermissionCode)
    ? (permission as PermissionCode)
    : null;
}

function normalizeProfile(row: ProfileQueryRow): AuthProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    email: row.email,
    accountStatus:
      row.account_status === "active" ||
      row.account_status === "pending" ||
      row.account_status === "disabled"
        ? row.account_status
        : "disabled",
  };
}

function flattenRoles(row: ProfileQueryRow) {
  return Array.from(
    new Set(
      (row.user_roles ?? [])
        .map((userRole) => userRole.roles?.name)
        .filter((role): role is string => Boolean(role))
        .map(toRoleName)
        .filter((role): role is RoleName => Boolean(role)),
    ),
  );
}

function flattenPermissions(row: ProfileQueryRow, roles: RoleName[]) {
  const explicitPermissions = (row.user_roles ?? []).flatMap((userRole) =>
    (userRole.roles?.role_permissions ?? [])
      .map((rolePermission) => rolePermission.permissions?.code)
      .filter((permission): permission is string => Boolean(permission))
      .map(toPermissionCode)
      .filter((permission): permission is PermissionCode =>
        Boolean(permission),
      ),
  );

  return Array.from(
    new Set([...explicitPermissions, ...permissionsForRoles(roles)]),
  );
}

export async function getAuthContext(): Promise<AuthContextResult> {
  if (!isSupabaseConfigured()) {
    return { status: "not_configured" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, auth_user_id, first_name, middle_name, last_name, email, account_status, user_roles:user_roles!user_roles_profile_id_fkey(roles(name, role_permissions(permissions(code))))",
    )
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return { status: "profile_missing", supabase };
  }

  const profileRow = data as unknown as ProfileQueryRow;
  const profile = normalizeProfile(profileRow);

  if (profile.accountStatus !== "active") {
    return { status: "inactive", supabase };
  }

  const roles = flattenRoles(profileRow);
  const permissions = flattenPermissions(profileRow, roles);

  return {
    status: "ok",
    context: {
      user,
      profile,
      roles,
      permissions,
      supabase,
    },
  };
}
