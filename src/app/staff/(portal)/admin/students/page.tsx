import { PageHeader } from "@/components/layout/page-header";
import { StudentSetupControls } from "@/components/admin/student-setup-controls";
import { getAdminPortalData } from "@/features/admin/admin-data";
import { requirePermission, requirePortalAccess } from "@/lib/auth/guards";

export default async function AdminStudentsPage() {
  const access = await requirePortalAccess("staff"); if (access.status === "not_configured") return null;
  requirePermission(access.context, "system.configure"); const data = await getAdminPortalData();
  return <div className="space-y-7"><PageHeader eyebrow="Admin · Step 5" title="Student Academic Setup" description="Link students to the correct programme and year, and manage active, suspended, withdrawn, or completed status." /><StudentSetupControls students={data.students} programmes={data.programmes} /></div>;
}
