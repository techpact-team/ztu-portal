import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStaffPortalData } from "@/features/staff/staff-data";

export default async function StaffStudentsPage() {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return null;
  }

  const data = await getStaffPortalData(access.context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff"
        title="Visible Students"
        description="Student records are limited to assigned courses or granted registrar permissions."
      />
      <div className="rounded-lg border border-border bg-card">
        {data.enrollments.map((student) => (
          <div key={student.enrollmentId} className="grid gap-2 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-3">
            <p className="font-semibold text-navy">{student.registrationNumber}</p>
            <p>{student.studentName}</p>
            <p className="text-muted-foreground">{student.courseCode}</p>
          </div>
        ))}
        {data.enrollments.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No visible student records" description="Students appear according to assignments and permissions." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
