"use client";

import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoleName } from "@/lib/constants/roles";

type UserCreateValues = {
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phone?: string;
  role: RoleName;
  registrationNumber?: string;
  staffNumber?: string;
  programmeId?: string;
  departmentId?: string;
};

type LookupOption = { id: string; label: string };

export function UserCreateForm({ programmes, departments }: { programmes: LookupOption[]; departments: LookupOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<UserCreateValues>({
    defaultValues: { role: "student" },
  });
  const selectedRole = useWatch({ control: form.control, name: "role" });
  const isStudent = selectedRole === "student";

  function onSubmit(values: UserCreateValues) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to create user.");
        return;
      }

      form.reset({ role: "student" });
      setMessage(payload.message ?? "Activation email requested.");
      router.refresh();
    });
  }

  return (
    <form
      className="rounded-lg border border-border bg-card p-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {message ? <p className="mb-4 rounded-md bg-green-50 p-3 text-success">{message}</p> : null}
      {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-danger">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Email" type="email" required {...form.register("email")} />
        <Input label="First name" required {...form.register("firstName")} />
        <Input label="Middle name" {...form.register("middleName")} />
        <Input label="Last name" required {...form.register("lastName")} />
        <label className="grid gap-2 text-sm font-semibold text-navy">
          Role <span className="sr-only">required</span>
          <select
            className="h-11 rounded-md border border-border bg-card px-3 text-base font-normal"
            {...form.register("role")}
          >
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="head_of_department">Head of Department</option>
            <option value="registrar">Registrar</option>
            <option value="system_administrator">System Administrator</option>
          </select>
        </label>
        <Input label="Phone" {...form.register("phone")} />
        {isStudent ? (
          <>
            <Input label="Registration number" required {...form.register("registrationNumber")} />
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Programme
              <select className="h-11 rounded-md border border-border bg-card px-3 text-base font-normal" required {...form.register("programmeId")}>
                <option value="">Select programme</option>
                {programmes.map((programme) => <option key={programme.id} value={programme.id}>{programme.label}</option>)}
              </select>
            </label>
          </>
        ) : (
          <>
            <Input label="Staff number" required {...form.register("staffNumber")} />
            <label className="grid gap-2 text-sm font-semibold text-navy">
              Department
              <select className="h-11 rounded-md border border-border bg-card px-3 text-base font-normal" {...form.register("departmentId")}>
                <option value="">No department</option>
                {departments.map((department) => <option key={department.id} value={department.id}>{department.label}</option>)}
              </select>
            </label>
          </>
        )}
      </div>
      <Button className="mt-6" type="submit" disabled={pending}>
        <UserPlus className="h-4 w-4" />
        {pending ? "Creating..." : "Create account"}
      </Button>
    </form>
  );
}
