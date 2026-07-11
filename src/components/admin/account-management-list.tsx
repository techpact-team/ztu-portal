"use client";

import { KeyRound, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AdminAccountView } from "@/features/admin/admin-data";
import { ROLE_LABELS, ROLE_NAMES, type RoleName } from "@/lib/constants/roles";

export function AccountManagementList({ accounts }: { accounts: AdminAccountView[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function act(payload: Record<string, string>) {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { error?: string; message?: string };
      setMessage(result.error ?? result.message ?? null);
      if (response.ok) router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="border-b border-border px-6 py-5"><h2 className="text-lg font-extrabold text-navy">Existing accounts</h2><p className="mt-1 text-sm text-muted-foreground">Activate, disable, reset access, or replace a user’s role.</p></div>
      {message ? <p className="m-5 rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-navy">{message}</p> : null}
      <div className="divide-y divide-border">
        {accounts.map((account) => (
          <article key={account.id} className="grid gap-4 px-6 py-5 xl:grid-cols-[1.5fr_1fr_auto] xl:items-center">
            <div><p className="font-extrabold text-navy">{account.first_name} {account.last_name}</p><p className="mt-1 text-sm text-muted-foreground">{account.email} · {account.registrationNumber ?? account.staffNumber ?? "No academic number"}</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label={`Role for ${account.email}`} defaultValue={account.roles[0] ?? "student"} disabled={pending} onChange={(event) => act({ action: "role", profileId: account.id, role: event.target.value as RoleName })} className="h-10 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-navy">
                {ROLE_NAMES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
              </select>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${account.account_status === "active" ? "bg-success/10 text-success" : account.account_status === "disabled" ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}>{account.account_status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" disabled={pending} onClick={() => act({ action: "reset", profileId: account.id })}><KeyRound className="h-4 w-4" />Reset</Button>
              <Button variant={account.account_status === "active" ? "danger" : "primary"} disabled={pending} onClick={() => act({ action: "status", profileId: account.id, status: account.account_status === "active" ? "disabled" : "active" })}><ShieldCheck className="h-4 w-4" />{account.account_status === "active" ? "Disable" : "Activate"}</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
