import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStudentPortalData } from "@/features/students/student-data";

export default async function StudentNoticesPage() {
  const access = await requirePortalAccess("student");

  if (access.status === "not_configured") {
    return null;
  }

  const data = await getStudentPortalData(access.context);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Student" title="Notices" />
      <div className="grid gap-4">
        {data.notices.map((notice) => (
          <article key={notice.id} className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-gold">
              {notice.audience}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-navy">{notice.title}</h2>
            <p className="mt-2 leading-7 text-muted-foreground">{notice.content}</p>
          </article>
        ))}
      </div>
      {data.notices.length === 0 ? (
        <EmptyState
          title="No notices"
          description="Published student notices will appear here."
        />
      ) : null}
    </div>
  );
}
