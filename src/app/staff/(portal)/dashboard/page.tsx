import { BookOpen, ClipboardCheck, FileCheck2, Users, Megaphone, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStaffPortalData } from "@/features/staff/staff-data";
import { getAdminPortalData } from "@/features/admin/admin-data";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function StaffDashboardPage() {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return null;
  }

  if (access.context.roles.includes("system_administrator")) {
    const adminData = await getAdminPortalData();
    return <div className="space-y-7"><PageHeader eyebrow="Administration" title={`Welcome, ${access.context.profile.firstName}`} description="Follow the administration sequence from accounts through configuration, assignments, and security monitoring." /><AdminDashboard data={adminData} /></div>;
  }

  const data = await getStaffPortalData(access.context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff Portal"
        title={`Welcome, ${access.context.profile.firstName} ${access.context.profile.lastName}`}
        description="Your dashboard adapts to your assigned roles and permissions."
      />

      {/* Welcome Banner */}
      <div className="bg-white border-l-4 border-primary p-5 rounded-r-lg border border-border shadow-sm text-sm leading-relaxed text-navy">
        <p>
          Welcome to the Zomba Theological University Staff Portal. Use the navigation menu to access your assigned courses, manage grades, and review academic results. For technical assistance, contact <span className="font-semibold text-primary underline">it-support@ztu.ac.mw</span>. <span className="font-semibold text-danger">Always logout when you finish your session.</span>
        </p>
      </div>

      {/* Stat Cards — UNIMA Template Style */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-lg border border-border p-5 shadow-sm flex gap-4 items-center">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assigned Courses</p>
            <p className="text-3xl font-bold text-navy font-mono mt-1">{data.courses.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border p-5 shadow-sm flex gap-4 items-center">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assessments</p>
            <p className="text-3xl font-bold text-navy font-mono mt-1">{data.assessments.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border p-5 shadow-sm flex gap-4 items-center">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <FileCheck2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Approvals</p>
            <p className="text-3xl font-bold text-navy font-mono mt-1">{data.submittedResults.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border p-5 shadow-sm flex gap-4 items-center">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Enrolments</p>
            <p className="text-3xl font-bold text-navy font-mono mt-1">{data.enrollments.length}</p>
          </div>
        </div>
      </div>

      {/* Notice Board + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-navy">Academic Notices</h2>
          </div>
          <div className="mt-4 space-y-4">
            {data.notices.map((notice) => (
              <article key={notice.id} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                <h3 className="font-semibold text-navy">{notice.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{notice.content}</p>
              </article>
            ))}
            {data.notices.length === 0 ? (
              <EmptyState title="No staff notices" description="Published staff notices will appear here." />
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-navy">Grade Submission Workflow</h2>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { step: "1", label: "Create Assessment", desc: "Create an assessment for an assigned course.", color: "bg-primary" },
              { step: "2", label: "Enter by Registration Number", desc: "Record marks for each enrolled student, then submit them to My Assessments.", color: "bg-primary" },
              { step: "3", label: "Submit Final Results", desc: "Send calculated end-of-semester results to the Registrar.", color: "bg-primary" },
              { step: "4", label: "Registrar Approves", desc: "Approved final results appear in the student's My Grades section.", color: "bg-primary" },
            ].map(item => (
              <div key={item.step} className="flex items-start gap-3">
                <span className={`${item.color} text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 mt-0.5`}>{item.step}</span>
                <div>
                  <p className="text-sm font-bold text-navy">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
