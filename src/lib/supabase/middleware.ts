import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserEnv, isSupabaseConfigured } from "@/lib/env";
import type { RoleName } from "@/lib/constants/roles";
import { STAFF_ROLES } from "@/lib/constants/roles";
import type { Database } from "@/types/database";

type MiddlewareProfile = {
  account_status: string;
  user_roles?: { roles: { name: string } | null }[] | null;
};

function isProtectedStudentPath(pathname: string) {
  return pathname.startsWith("/student/") && !pathname.startsWith("/student/login");
}

function isProtectedStaffPath(pathname: string) {
  return pathname.startsWith("/staff/") && !pathname.startsWith("/staff/login");
}

function roleNames(profile: MiddlewareProfile | null): RoleName[] {
  return (profile?.user_roles ?? [])
    .map((userRole) => userRole.roles?.name)
    .filter((role): role is RoleName =>
      Boolean(role && ["student", ...STAFF_ROLES].includes(role as RoleName)),
    );
}

function redirectToLogin(request: NextRequest, portal: "student" | "staff") {
  const url = request.nextUrl.clone();
  url.pathname = `/${portal}/login`;
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const studentPath = isProtectedStudentPath(pathname);
  const staffPath = isProtectedStaffPath(pathname);

  if (!studentPath && !staffPath) {
    return NextResponse.next({ request });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const { url, anonKey } = getSupabaseBrowserEnv();
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectToLogin(request, studentPath ? "student" : "staff");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status, user_roles:user_roles!user_roles_profile_id_fkey(roles(name))")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const normalizedProfile = profile as unknown as MiddlewareProfile | null;

  if (!normalizedProfile || normalizedProfile.account_status !== "active") {
    await supabase.auth.signOut();
    return redirectToLogin(request, studentPath ? "student" : "staff");
  }

  const roles = roleNames(normalizedProfile);

  if (studentPath && !roles.includes("student")) {
    const url = request.nextUrl.clone();
    url.pathname = "/forbidden";
    return NextResponse.redirect(url);
  }

  if (staffPath && !roles.some((role) => STAFF_ROLES.includes(role))) {
    const url = request.nextUrl.clone();
    url.pathname = "/forbidden";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
