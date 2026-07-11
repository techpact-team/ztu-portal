import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function StaffLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4 py-16">
      <Suspense
        fallback={
          <div className="rounded-lg border border-border bg-white p-8 shadow-sm">
            Loading secure login...
          </div>
        }
      >
        <LoginForm portal="staff" />
      </Suspense>
    </main>
  );
}
