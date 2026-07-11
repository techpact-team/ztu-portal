import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStaffPortalData } from "@/features/staff/staff-data";

export default async function StaffGradesPage() {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return null;
  }

  const data = await getStaffPortalData(access.context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff"
        title="Grade Entry"
        description="Select an assessment, enter marks against student registration numbers, then submit them to the student portal."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {data.assessments.map((assessment) => {
          const course = data.courses.find((item) => item.offeringId === assessment.course_offering_id);

          return (
            <Link
              key={assessment.id}
              href={`/staff/grades/${assessment.id}`}
              className="rounded-lg border border-border bg-card p-5 transition hover:border-gold"
            >
              <p className="text-sm font-semibold text-gold">{course?.courseCode ?? "Course"}</p>
              <h2 className="mt-1 text-xl font-semibold text-navy">{assessment.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {assessment.maximum_score} max · {assessment.weight_percentage}% weight
              </p>
            </Link>
          );
        })}
      </div>
      {data.assessments.length === 0 ? (
        <EmptyState title="No assessments available" description="Create an assessment before entering grades." />
      ) : null}
    </div>
  );
}
