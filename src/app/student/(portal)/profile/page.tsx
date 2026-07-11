import { PageHeader } from "@/components/layout/page-header";
import { requirePortalAccess } from "@/lib/auth/guards";
import { getStudentPortalData } from "@/features/students/student-data";

export default async function StudentProfilePage() {
  const access = await requirePortalAccess("student");

  if (access.status === "not_configured") {
    return null;
  }

  const data = await getStudentPortalData(access.context);
  const profile = access.context.profile;

  const rows = [
    ["Full name", `${profile.firstName} ${profile.middleName ?? ""} ${profile.lastName}`],
    ["Email", profile.email],
    ["Registration number", data.student?.registration_number ?? "Pending"],
    ["Programme", data.programme?.name ?? "Pending"],
    ["Year of study", data.student?.year_of_study ?? "Pending"],
    ["Student status", data.student?.student_status ?? "Pending"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student"
        title="My Profile"
        description="Profile data is created and maintained by authorized university staff."
      />
      <section className="rounded-lg border border-border bg-card p-6">
        <dl className="grid gap-4 md:grid-cols-2">
          {rows.map(([label, value]) => (
            <div key={String(label)} className="rounded-md border border-border p-4">
              <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
              <dd className="mt-1 font-semibold text-navy">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
