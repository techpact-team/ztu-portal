import { WorkflowActions } from "@/components/staff/workflow-actions";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePermission, requirePortalAccess } from "@/lib/auth/guards";
import { getStaffPortalData } from "@/features/staff/staff-data";

export default async function StaffResultsPage() {
  const access = await requirePortalAccess("staff");
  if (access.status === "not_configured") return null;
  requirePermission(access.context, "results.publish");
  const data = await getStaffPortalData(access.context);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Registrar" title="Published Results Archive" description="Approved results are already visible in My Grades. Publishing records the final official release." />
      <div className="grid gap-4">
        {data.approvedResults.map((result) => (
          <article key={result.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><StatusBadge tone="success">{result.result_status}</StatusBadge><p className="mt-3 font-mono text-xs font-extrabold text-primary">{result.registrationNumber}</p><p className="mt-1 font-extrabold text-navy">{result.studentName}</p><p className="mt-1 text-sm font-semibold text-muted-foreground">{result.courseCode} · Final score {result.final_score ?? "N/A"} · Grade {result.letter_grade ?? "N/A"}</p></div>
              <WorkflowActions courseResultId={result.id} mode="publish" />
            </div>
          </article>
        ))}
      </div>
      {data.approvedResults.length === 0 ? <EmptyState title="No approved results" description="Approved results awaiting final publication will appear here." /> : null}
    </div>
  );
}
