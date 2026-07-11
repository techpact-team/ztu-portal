import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { PageHeader } from "@/components/layout/page-header";

export default function StudentChangePasswordPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Change Password"
        description="Choose a strong password. Passwords are managed by Supabase Auth and are never stored by the application."
      />
      <ChangePasswordForm />
    </div>
  );
}
