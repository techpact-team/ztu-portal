"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, User, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { loginSchema, type LoginInput } from "@/lib/validation/auth-schemas";

type LoginFormProps = {
  portal: "student" | "staff";
};

export function LoginForm({ portal }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      portal,
    },
  });

  function onSubmit(values: LoginInput) {
    setFormError(null);
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/login";

    Object.entries(values).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  }

  const pending = form.formState.isSubmitting;
  const displayedError = formError ?? searchParams.get("error");

  return (
    <div className="mx-auto w-full max-w-[460px] bg-white rounded-lg border border-border p-8 shadow-sm flex flex-col items-center">
      {/* University Logo and Branding */}
      <div className="flex flex-col items-center text-center mb-6">
        <Image
          src="/ztu-seal.jpg"
          alt="Zomba Theological University seal"
          width={80}
          height={80}
          className="h-20 w-20 rounded-full object-cover mb-3"
          priority
        />
        <h2 className="text-xl font-bold tracking-tight text-navy uppercase leading-tight">
          Zomba Theological University
        </h2>
        <h3 className="text-lg font-semibold tracking-wide text-primary mt-1 uppercase">
          {portal === "student" ? "Students Portal" : "Staff Portal"}
        </h3>
      </div>

      <p className="text-sm text-muted-foreground mb-6 font-medium">
        Sign in to start your session
      </p>

      <form className="w-full space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Email Address with Icon */}
        <div className="space-y-1">
          <div className="flex rounded-md border border-border bg-card overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition">
            <span className="inline-flex items-center justify-center px-3 bg-muted text-muted-foreground border-r border-border">
              <User className="h-4 w-4" />
            </span>
            <input
              type="email"
              placeholder="Email address"
              autoComplete="email"
              required
              disabled={pending}
              className="flex-1 h-11 px-3 text-base outline-none bg-transparent placeholder:text-muted-foreground text-foreground"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email?.message && (
            <p className="text-xs font-semibold text-danger mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        {/* Password with Icon */}
        <div className="space-y-1">
          <div className="flex rounded-md border border-border bg-card overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition">
            <span className="inline-flex items-center justify-center px-3 bg-muted text-muted-foreground border-r border-border">
              <KeyRound className="h-4 w-4" />
            </span>
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required
              disabled={pending}
              className="flex-1 h-11 px-3 text-base outline-none bg-transparent placeholder:text-muted-foreground text-foreground"
              {...form.register("password")}
            />
          </div>
          {form.formState.errors.password?.message && (
            <p className="text-xs font-semibold text-danger mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        <input type="hidden" {...form.register("portal")} />

        {/* Status Alerts */}
        {displayedError ? (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm font-medium text-danger border border-danger/25">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{displayedError}</span>
          </div>
        ) : null}

        {/* Buttons Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <button
            type="submit"
            disabled={pending || !configured}
            className="h-11 rounded-md bg-primary font-bold text-white text-sm tracking-wide shadow-sm hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground transition flex items-center justify-center cursor-pointer"
          >
            {pending ? "Signing In..." : "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="h-11 rounded-md border border-primary font-bold text-primary text-sm tracking-wide hover:bg-primary/10 transition flex items-center justify-center cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
