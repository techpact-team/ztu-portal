"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AcademicPeriodRow } from "@/types/database";

export function RegistrationControls({ periods }: { periods: AcademicPeriodRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deadlines, setDeadlines] = useState<Record<string, string>>(() => Object.fromEntries(periods.map((period) => [period.id, period.registration_deadline ?? ""])));
  const [message, setMessage] = useState<string | null>(null);
  function act(periodId: string, action: "open" | "close" | "reopen") {
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/registration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ periodId, action, deadline: deadlines[periodId] || null }) });
      const result = await response.json() as { error?: string; message?: string };
      setMessage(result.error ?? result.message ?? null);
      if (response.ok) router.refresh();
    });
  }
  return <div className="space-y-4">{message ? <p className="rounded-xl bg-muted px-4 py-3 text-sm font-bold text-navy">{message}</p> : null}{periods.map((period) => <article key={period.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm"><div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-end"><div><p className="text-lg font-extrabold text-navy">{period.academic_year} · Semester {period.semester}</p><p className="mt-1 text-sm text-muted-foreground">Period status: {period.status} · Registration: {period.registration_open ? "open" : "closed"}</p></div><label className="grid gap-1.5 text-sm font-bold text-navy">Registration deadline<input type="date" value={deadlines[period.id] ?? ""} onChange={(event) => setDeadlines((current) => ({ ...current, [period.id]: event.target.value }))} className="h-11 rounded-xl border border-border px-3" /></label><div className="flex flex-wrap gap-2">{period.registration_open ? <Button variant="danger" disabled={pending} onClick={() => act(period.id, "close")}>Close</Button> : <><Button disabled={pending} onClick={() => act(period.id, "open")}>Open</Button><Button variant="secondary" disabled={pending} onClick={() => act(period.id, "reopen")}>Reopen</Button></>}</div></div></article>)}</div>;
}
