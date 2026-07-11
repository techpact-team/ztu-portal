import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePermission, requirePortalAccess } from "@/lib/auth/guards";
import { getStaffPortalData } from "@/features/staff/staff-data";

export default async function StaffAuditLogsPage() {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return null;
  }

  requirePermission(access.context, "audit_logs.read");
  const data = await getStaffPortalData(access.context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Audit Logs"
        description="Monitor failed logins, role and account changes, academic configuration, assignments, and protected actions."
      />
      <div className="rounded-lg border border-border bg-card">
        {data.auditLogs.map((log) => (
          <div key={log.id} className="grid gap-2 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[1fr_1fr_0.8fr_1.2fr]">
            <p className="font-semibold text-navy">{log.action}</p>
            <p>{log.entity_type}</p>
            <p className="font-mono text-xs text-muted-foreground">{log.ip_address ?? "No IP"}</p>
            <p className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
          </div>
        ))}
        {data.auditLogs.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No audit events visible" description="Events will appear after sensitive actions are recorded." />
          </div>
        ) : null}
      </div>
    </div>
  );
}
