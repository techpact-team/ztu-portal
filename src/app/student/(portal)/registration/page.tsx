import { CalendarDays, CheckCircle2, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CourseRegistrationForm } from "@/components/student/course-registration-form";
import { EmptyState } from "@/components/ui/empty-state";
import { getStudentPortalData } from "@/features/students/student-data";
import { requirePortalAccess } from "@/lib/auth/guards";

export default async function CourseRegistrationPage() {
  const access = await requirePortalAccess("student");
  if (access.status === "not_configured") return null;
  const data = await getStudentPortalData(access.context);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Registration" title="Course Registration" description="Review the compulsory courses suggested for your programme and confirm your selection." />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-white p-5"><GraduationCap className="h-5 w-5 text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Programme</p><p className="mt-1 font-bold text-navy">{data.programme?.name ?? "Not assigned"}</p></div>
        <div className="rounded-2xl border border-border bg-white p-5"><CalendarDays className="h-5 w-5 text-primary" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Academic period</p><p className="mt-1 font-bold text-navy">{data.activePeriod ? `${data.activePeriod.academic_year} · Semester ${data.activePeriod.semester}` : "Registration closed"}</p></div>
        <div className="rounded-2xl border border-border bg-white p-5"><CheckCircle2 className="h-5 w-5 text-success" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Student status</p><p className="mt-1 font-bold capitalize text-navy">{data.student?.student_status ?? "Unavailable"} · Year {data.student?.year_of_study ?? "—"}</p></div>
      </div>
      {data.availableCourses.length ? <CourseRegistrationForm courses={data.availableCourses} /> : <div className="rounded-2xl border border-border bg-white p-10"><EmptyState title="No courses available" description="There are no active course offerings matching your programme and year, or registration is closed." /></div>}
    </div>
  );
}
