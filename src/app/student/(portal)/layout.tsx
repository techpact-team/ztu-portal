import { PortalSetupRequired } from "@/components/layout/portal-setup-required";
import { PortalShell, type PortalNavItem } from "@/components/layout/portal-shell";
import { requirePortalAccess } from "@/lib/auth/guards";

const studentNav: PortalNavItem[] = [
  { href: "/student/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/student/registration", label: "Course Registration", icon: "assessments" },
  { href: "/student/courses", label: "My Registered Courses", icon: "courses" },
  { href: "/student/assessments", label: "My Assessments", icon: "assessments" },
  { href: "/student/results", label: "My Grades", icon: "results" },
  { href: "/student/change-password", label: "Change Password", icon: "password" },
];

export default async function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await requirePortalAccess("student");

  if (access.status === "not_configured") {
    return <PortalSetupRequired portal="student" />;
  }

  const { profile } = access.context;
  const { data: activePeriod } = await access.context.supabase
    .from("academic_periods")
    .select("academic_year, semester")
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <PortalShell
      navItems={studentNav}
      portalLabel="Student Portal"
      userName={`${profile.firstName} ${profile.lastName}`}
      academicSession={activePeriod ? `${activePeriod.academic_year} · Semester ${activePeriod.semester}` : undefined}
      loginHref="/student/login"
    >
      {children}
    </PortalShell>
  );
}
