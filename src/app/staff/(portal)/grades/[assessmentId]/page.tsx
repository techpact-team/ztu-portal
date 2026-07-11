import { GradeEntryForm } from "@/components/staff/grade-entry-form";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getGradeEntryData } from "@/features/staff/staff-data";

export default async function StaffGradeEntryPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return null;
  }

  const { assessmentId } = await params;
  const data = await getGradeEntryData(access.context, assessmentId);

  if (!data.assessment) {
    return <EmptyState title="Assessment not found" description="This assessment is not visible to your account." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={data.course?.code ?? "Assessment"}
        title={data.assessment.name}
        description={`Enter scores out of ${data.assessment.maximum_score} using each student's unique registration number. Submitted marks appear in the student's My Assessments section.`}
      />
      <GradeEntryForm
        assessmentId={data.assessment.id}
        maximumScore={data.assessment.maximum_score}
        rows={data.rows}
      />
    </div>
  );
}
