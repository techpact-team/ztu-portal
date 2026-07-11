import { AlertTriangle, Bell, BookOpen, CheckCircle, FileText, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStudentPortalData } from "@/features/students/student-data";

export default async function StudentDashboardPage() {
  const access = await requirePortalAccess("student");
  if (access.status === "not_configured") return null;

  const data = await getStudentPortalData(access.context);
  const profile = access.context.profile;
  const failCount = data.results.filter((result) => result.letterGrade === "F").length;
  const statusLabel = failCount > 0 ? "REFERRED" : data.results.length > 0 ? "PASS" : "PENDING";

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Student Portal" title={`Welcome, ${profile.firstName} ${profile.lastName}`} description={data.student ? `Registration No: ${data.student.registration_number}` : "Your student portal"} />

      <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen className="h-5 w-5" /></span><div><h2 className="text-lg font-bold text-navy">Enrolled Courses</h2><p className="text-xs text-muted-foreground">Your confirmed courses for the current session</p></div></div>
          <span className="w-fit rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">{data.courses.length} registered</span>
        </div>
        {data.courses.length === 0 ? <div className="p-10"><EmptyState title="No courses found" description="Confirm your eligible courses from Course Registration." /></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="bg-muted/45 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground"><th className="px-6 py-3">Code</th><th className="px-6 py-3">Course title</th><th className="px-6 py-3 text-center">Credits</th><th className="px-6 py-3 text-center">Semester</th><th className="px-6 py-3 text-right">Status</th></tr></thead><tbody>{data.courses.map((course) => <tr key={course.enrollmentId} className="border-t border-border"><td className="px-6 py-4 font-mono text-xs font-bold text-primary">{course.courseCode}</td><td className="px-6 py-4 font-semibold text-navy">{course.courseTitle}</td><td className="px-6 py-4 text-center text-muted-foreground">{course.creditHours}</td><td className="px-6 py-4 text-center text-muted-foreground">{course.semester}</td><td className="px-6 py-4 text-right"><span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold uppercase text-success">{course.status}</span></td></tr>)}</tbody></table></div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Enrolled courses", value: String(data.courses.length), icon: BookOpen, tone: "bg-primary/10 text-primary" },
          { label: "Released grades", value: String(data.results.length), icon: FileText, tone: "bg-success/10 text-success" },
          { label: "Current GPA", value: data.gpa !== null ? data.gpa.toFixed(2) : "—", icon: TrendingUp, tone: "bg-gold/10 text-gold" },
          { label: "Academic status", value: statusLabel, icon: statusLabel === "PASS" ? CheckCircle : AlertTriangle, tone: statusLabel === "REFERRED" ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground" },
        ].map(({ label, value, icon: Icon, tone }) => <div key={label} className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-6 w-6" /></span><div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-navy">{value}</p></div></div>)}
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-4"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Bell className="h-4 w-4" /></span><div><h2 className="text-lg font-bold text-navy">Notices</h2><p className="text-xs text-muted-foreground">Latest university updates</p></div></div>
        {data.notices.length === 0 ? <div className="py-8"><EmptyState title="No notices" description="Published notices will appear here." /></div> : (
          <div className="relative mt-2 divide-y divide-border before:absolute before:bottom-5 before:left-[7px] before:top-5 before:w-px before:bg-border">
            {data.notices.map((notice) => <article key={notice.id} className="relative grid gap-1 py-5 pl-8"><span className="absolute left-0 top-7 h-[15px] w-[15px] rounded-full border-4 border-white bg-gold ring-1 ring-border" /><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-sm font-bold text-navy">{notice.title}</h3><time className="text-xs font-medium text-muted-foreground">{new Date(notice.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time></div><p className="max-w-4xl text-sm leading-6 text-muted-foreground">{notice.content}</p></article>)}
          </div>
        )}
      </section>
    </div>
  );
}
