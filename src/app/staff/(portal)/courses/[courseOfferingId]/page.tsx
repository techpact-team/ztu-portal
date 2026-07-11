import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStaffCourseDetail } from "@/features/staff/staff-data";

export default async function StaffCourseDetailPage({
  params,
}: {
  params: Promise<{ courseOfferingId: string }>;
}) {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return null;
  }

  const { courseOfferingId } = await params;
  const detail = await getStaffCourseDetail(access.context, courseOfferingId);

  if (!detail) {
    return <EmptyState title="Course not found" description="This course is not visible to your account." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={detail.courseCode}
        title={detail.courseTitle}
        description={`${detail.enrolledStudents} enrolled students and ${detail.assessments.length} assessments.`}
      />
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-navy">Enrolled students</h2>
        <div className="mt-4 grid gap-3">
          {detail.students.map((student) => (
            <div key={student.enrollmentId} className="rounded-md border border-border p-4">
              <p className="font-semibold text-navy">{student.studentName}</p>
              <p className="text-sm text-muted-foreground">{student.registrationNumber}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
