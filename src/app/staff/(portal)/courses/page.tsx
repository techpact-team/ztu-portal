import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStaffPortalData } from "@/features/staff/staff-data";

export default async function StaffCoursesPage() {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return null;
  }

  const data = await getStaffPortalData(access.context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff"
        title="Assigned Courses"
        description="Lecturers see assigned course offerings. Registrar and approved staff see broader academic records according to permissions."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {data.courses.map((course) => (
          <Link
            key={course.offeringId}
            href={`/staff/courses/${course.offeringId}`}
            className="rounded-lg border border-border bg-card p-5 transition hover:border-gold"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gold">{course.courseCode}</p>
                <h2 className="mt-1 text-xl font-semibold text-navy">{course.courseTitle}</h2>
              </div>
              <StatusBadge tone="success">{course.status}</StatusBadge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {course.enrolledStudents} students · {course.assessments} assessments
            </p>
          </Link>
        ))}
      </div>
      {data.courses.length === 0 ? (
        <EmptyState title="No visible courses" description="Courses appear after assignment or academic authorization." />
      ) : null}
    </div>
  );
}
