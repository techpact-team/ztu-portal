import { UserCreateForm } from "@/components/staff/user-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { requirePermission, requirePortalAccess } from "@/lib/auth/guards";
import { getAdminPortalData } from "@/features/admin/admin-data";
import { AccountManagementList } from "@/components/admin/account-management-list";

export default async function StaffUsersPage() {
  const access = await requirePortalAccess("staff");

  if (access.status === "not_configured") {
    return null;
  }

  requirePermission(access.context, "users.create");
  const data = await getAdminPortalData();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Users & Roles"
        description="Create accounts through Supabase Auth and assign the initial portal role. Academic permissions remain separate from technical administration."
      />
      <UserCreateForm
        programmes={data.programmes.map((programme) => ({ id: programme.id, label: `${programme.code} — ${programme.name}` }))}
        departments={data.departments.map((department) => ({ id: department.id, label: `${department.code} — ${department.name}` }))}
      />
      <AccountManagementList accounts={data.accounts} />
    </div>
  );
}
