import type { PermissionCode } from "@/lib/constants/permissions";
import { PortalSetupRequired } from "@/components/layout/portal-setup-required";
import { PortalShell, type PortalNavItem } from "@/components/layout/portal-shell";
import { requirePortalAccess } from "@/lib/auth/guards";

const standardStaffNav: Array<PortalNavItem & { permission?: PermissionCode }> = [
  { href: "/staff/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/staff/courses", label: "Assigned Courses", icon: "courses", permission: "courses.read_assigned" },
  { href: "/staff/assessments", label: "Assessments", icon: "assessments", permission: "assessments.create_assigned" },
  { href: "/staff/grades", label: "Grade Entry", icon: "results", permission: "grades.create_assigned" },
  { href: "/staff/approvals", label: "Approvals", icon: "approvals", permission: "grades.approve_department" },
  { href: "/staff/results", label: "Publish Results", icon: "notices", permission: "results.publish" },
  { href: "/staff/students", label: "Students", icon: "students", permission: "students.manage" },
  { href: "/staff/users", label: "Users & Roles", icon: "users", permission: "users.create" },
  { href: "/staff/audit-logs", label: "Audit Logs", icon: "audit", permission: "audit_logs.read" },
];

const adminNav: PortalNavItem[] = [
  { href: "/staff/dashboard", label: "Admin Overview", icon: "dashboard" },
  { href: "/staff/users", label: "Accounts & Roles", icon: "users" },
  { href: "/staff/admin/academic", label: "Academic Structure", icon: "courses" },
  { href: "/staff/admin/registration", label: "Registration Periods", icon: "approvals" },
  { href: "/staff/admin/assignments", label: "Lecturer Assignments", icon: "students" },
  { href: "/staff/admin/students", label: "Student Setup", icon: "profile" },
  { href: "/staff/audit-logs", label: "Audit & Security", icon: "audit" },
];

const registrarNav: PortalNavItem[] = [
  { href: "/staff/dashboard", label: "Registrar Overview", icon: "dashboard" },
  { href: "/staff/registrations", label: "Registration Review", icon: "approvals" },
  { href: "/staff/approvals", label: "Final Result Approvals", icon: "results" },
  { href: "/staff/results", label: "Publish Results", icon: "notices" },
  { href: "/staff/students", label: "Student Records", icon: "students" },
];

export default async function StaffPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return <PortalSetupRequired portal="staff" />;
  }

  const { profile, permissions } = access.context;
  const visibleNav = access.context.roles.includes("system_administrator")
    ? adminNav
    : access.context.roles.includes("registrar")
      ? registrarNav
    : standardStaffNav.filter((item) => !item.permission || permissions.includes(item.permission));
  const { data: activePeriod } = await access.context.supabase
    .from("academic_periods")
    .select("academic_year, semester")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <PortalShell
      navItems={visibleNav}
      portalLabel={access.context.roles.includes("system_administrator") ? "Admin Portal" : access.context.roles.includes("registrar") ? "Registrar Portal" : "Staff Portal"}
      userName={`${profile.firstName} ${profile.lastName}`}
      academicSession={activePeriod ? `${activePeriod.academic_year} · Semester ${activePeriod.semester}` : undefined}
      loginHref="/staff/login"
    >
      {children}
    </PortalShell>
  );
}
