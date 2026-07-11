import { PageHeader } from "@/components/layout/page-header";
import { RegistrationControls } from "@/components/admin/registration-controls";
import { getAdminPortalData } from "@/features/admin/admin-data";
import { requirePermission, requirePortalAccess } from "@/lib/auth/guards";

export default async function AdminRegistrationPage() {
  const access = await requirePortalAccess("staff"); if (access.status === "not_configured") return null;
  requirePermission(access.context, "system.configure"); const data = await getAdminPortalData();
  return <div className="space-y-7"><PageHeader eyebrow="Admin · Step 3" title="Registration Periods" description="Control when students may register. Programme, year, offering status, deadlines, and duplicate constraints remain enforced." /><RegistrationControls periods={data.periods} /></div>;
}
