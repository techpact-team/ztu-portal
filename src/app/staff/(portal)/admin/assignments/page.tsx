import { PageHeader } from "@/components/layout/page-header";
import { LecturerAssignmentControls } from "@/components/admin/lecturer-assignment-controls";
import { getAdminPortalData } from "@/features/admin/admin-data";
import { requirePermission, requirePortalAccess } from "@/lib/auth/guards";

export default async function AdminAssignmentsPage() {
  const access = await requirePortalAccess("staff"); if (access.status === "not_configured") return null;
  requirePermission(access.context, "system.configure"); const data = await getAdminPortalData();
  return <div className="space-y-7"><PageHeader eyebrow="Admin · Step 4" title="Lecturer Assignments" description="Assign or replace lecturers on a specific course offering. Their portal access is restricted to these assignments." /><LecturerAssignmentControls staff={data.staff} offerings={data.offerings} assignments={data.assignments} /></div>;
}
