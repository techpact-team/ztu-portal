import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStudentPortalData } from "@/features/students/student-data";
import { AssessmentsList } from "@/components/student/assessments-list";

export default async function StudentAssessmentsPage() {
  const access = await requirePortalAccess("student");

  if (access.status === "not_configured") {
    return null;
  }

  const data = await getStudentPortalData(access.context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="My Assessments"
        description="Assessment marks appear here after your lecturer submits them. Draft marks remain private."
      />
      
      {data.assessments.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-8">
          <EmptyState
            title="No assessment scores"
            description="Your lecturer has not submitted any assessment marks yet."
          />
        </div>
      ) : (
        <AssessmentsList courses={data.courses} assessments={data.assessments} />
      )}
    </div>
  );
}
