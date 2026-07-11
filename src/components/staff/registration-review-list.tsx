"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { RegistrationReviewView } from "@/features/staff/registration-data";

export function RegistrationReviewList({ registrations }: { registrations: RegistrationReviewView[] }) {
  const router = useRouter(); const [pending, startTransition] = useTransition(); const [message, setMessage] = useState<string | null>(null);
  function review(enrollmentId: string, decision: "confirm" | "reject") { setMessage(null); startTransition(async () => { const response = await fetch("/api/registrations/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enrollmentId, decision }) }); const result = await response.json() as { error?: string; message?: string }; setMessage(result.error ?? result.message ?? null); if (response.ok) router.refresh(); }); }
  return <div className="space-y-4">{message ? <p className="rounded-xl bg-muted px-4 py-3 text-sm font-bold text-navy">{message}</p> : null}{registrations.map((item) => <article key={item.enrollmentId} className="rounded-2xl border border-border bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="font-mono text-xs font-extrabold text-primary">{item.registrationNumber}</p><p className="mt-1 font-extrabold text-navy">{item.studentName}</p><p className="mt-1 text-sm text-muted-foreground">{item.courseCode} — {item.courseTitle} · Submitted {new Date(item.submittedAt).toLocaleDateString("en-GB")}</p></div><div className="flex gap-2"><Button disabled={pending} onClick={() => review(item.enrollmentId, "confirm")}><CheckCircle2 className="h-4 w-4" />Confirm</Button><Button variant="danger" disabled={pending} onClick={() => review(item.enrollmentId, "reject")}><XCircle className="h-4 w-4" />Reject</Button></div></div></article>)}</div>;
}
