import { AssessmentCreateForm } from "@/components/staff/assessment-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStaffPortalData } from "@/features/staff/staff-data";

export default async function StaffAssessmentsPage() {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return null;
  }

  const data = await getStaffPortalData(access.context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Staff"
        title="Assessment Management"
        description="Create an assessment for an assigned course. Enrolled students are linked automatically through their registration numbers."
      />
      <AssessmentCreateForm
        courses={data.courses.map((course) => ({
          offeringId: course.offeringId,
          label: `${course.courseCode} - ${course.courseTitle}`,
        }))}
      />
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-navy">Existing assessments</h2>
        <div className="mt-4 grid gap-3">
          {data.assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-md border border-border p-4">
              <p className="font-semibold text-navy">{assessment.name}</p>
              <p className="text-sm text-muted-foreground">
                {assessment.assessment_type} · {assessment.maximum_score} max · {assessment.weight_percentage}% weight
              </p>
            </div>
          ))}
        </div>
        {data.assessments.length === 0 ? (
          <EmptyState title="No assessments" description="Create the first assessment for an assigned course." />
        ) : null}
      </section>
    </div>
  );
}
