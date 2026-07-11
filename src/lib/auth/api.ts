import { NextResponse } from "next/server";
import type { PermissionCode } from "@/lib/constants/permissions";
import { getAuthContext } from "@/lib/auth/context";
import { hasPermission } from "@/lib/auth/access-control";
import type { AuthContext } from "@/types/auth";

export type ApiAuthResult =
  | { ok: true; context: AuthContext }
  | { ok: false; response: NextResponse };

export async function requireApiPermission(
  permission?: PermissionCode,
): Promise<ApiAuthResult> {
  const auth = await getAuthContext();

  if (auth.status === "not_configured") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 503 },
      ),
    };
  }

  if (auth.status === "unauthenticated") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (auth.status === "profile_missing" || auth.status === "inactive") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (permission) {
    const allowed = hasPermission(
      {
        accountStatus: auth.context.profile.accountStatus,
        roles: auth.context.roles,
        permissions: auth.context.permissions,
      },
      permission,
    );

    if (!allowed) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  }

  return { ok: true, context: auth.context };
}
