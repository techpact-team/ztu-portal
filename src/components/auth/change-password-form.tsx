"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "@/lib/validation/auth-schemas";

export function ChangePasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  function onSubmit(values: ChangePasswordInput) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to update password.");
        return;
      }

      form.reset();
      setMessage(payload.message ?? "Password updated.");
    });
  }

  return (
    <form
      className="max-w-xl rounded-lg border border-border bg-card p-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {message ? (
        <div className="mb-4 rounded-md border border-success/20 bg-green-50 p-3 text-sm font-medium text-success">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-md border border-danger/20 bg-red-50 p-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          error={form.formState.errors.confirmPassword?.message}
          {...form.register("confirmPassword")}
        />
      </div>
      <Button className="mt-6" type="submit" disabled={pending}>
        {pending ? "Updating..." : "Change password"}
      </Button>
    </form>
  );
}
