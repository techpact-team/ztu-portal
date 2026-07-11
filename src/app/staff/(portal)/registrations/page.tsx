import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RegistrationReviewList } from "@/components/staff/registration-review-list";
import { getRegistrationReviews } from "@/features/staff/registration-data";
import { requirePermission, requirePortalAccess } from "@/lib/auth/guards";

export default async function RegistrarRegistrationsPage() {
  const access = await requirePortalAccess("staff"); if (access.status === "not_configured") return null;
  requirePermission(access.context, "enrolments.manage");
  const registrations = await getRegistrationReviews(access.context);
  return <div className="space-y-7"><PageHeader eyebrow="Registrar" title="Course Registration Review" description="Confirm or reject student-submitted courses. Only confirmed courses appear under My Registered Courses." />{registrations.length ? <RegistrationReviewList registrations={registrations} /> : <EmptyState title="No submitted registrations" description="New student course selections will appear here." />}</div>;
}
