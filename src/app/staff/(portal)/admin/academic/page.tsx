import { PageHeader } from "@/components/layout/page-header";
import { AcademicSetupForms } from "@/components/admin/academic-setup-forms";
import { getAdminPortalData } from "@/features/admin/admin-data";
import { requirePermission, requirePortalAccess } from "@/lib/auth/guards";

export default async function AdminAcademicPage() {
  const access = await requirePortalAccess("staff"); if (access.status === "not_configured") return null;
  requirePermission(access.context, "system.configure");
  const data = await getAdminPortalData();
  return <div className="space-y-7"><PageHeader eyebrow="Admin · Step 2" title="Academic Structure" description="Build the hierarchy in order: department, programme, course, academic period, then semester course offering." /><AcademicSetupForms data={data} /></div>;
}
