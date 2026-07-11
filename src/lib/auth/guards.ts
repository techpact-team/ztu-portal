import { redirect } from "next/navigation";
import type { PermissionCode } from "@/lib/constants/permissions";
import { canAccessPortal, hasPermission } from "@/lib/auth/access-control";
import { getAuthContext } from "@/lib/auth/context";
import type { AuthContext } from "@/types/auth";

export type PortalGuardResult =
  | { status: "not_configured" }
  | { status: "ok"; context: AuthContext };

export async function requirePortalAccess(
  portal: "student" | "staff",
): Promise<PortalGuardResult> {
  const auth = await getAuthContext();

  if (auth.status === "not_configured") {
    return { status: "not_configured" };
  }

  if (auth.status === "unauthenticated") {
    redirect(`/${portal}/login`);
  }

  if (auth.status === "profile_missing" || auth.status === "inactive") {
    redirect(`/${portal}/login?error=account`);
  }

  const snapshot = {
    accountStatus: auth.context.profile.accountStatus,
    roles: auth.context.roles,
    permissions: auth.context.permissions,
  };

  if (!canAccessPortal(snapshot, portal)) {
    redirect("/forbidden");
  }

  return { status: "ok", context: auth.context };
}

export function requirePermission(
  context: AuthContext,
  permission: PermissionCode,
) {
  const snapshot = {
    accountStatus: context.profile.accountStatus,
    roles: context.roles,
    permissions: context.permissions,
  };

  if (!hasPermission(snapshot, permission)) {
    redirect("/forbidden");
  }
}
