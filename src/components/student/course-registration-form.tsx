"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AvailableCourseView } from "@/features/students/student-data";

export function CourseRegistrationForm({ courses }: { courses: AvailableCourseView[] }) {
  const router = useRouter();
  const selectable = courses.filter((course) => !course.alreadyRegistered);
  const [selected, setSelected] = useState(() => new Set(selectable.filter((course) => course.registrationType === "compulsory").map((course) => course.offeringId)));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    setError(null); setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/course-registrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offeringIds: [...selected] }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? "Registration could not be completed."); return; }
      setMessage(result.message); setSelected(new Set()); router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="grid grid-cols-[auto_1fr_auto] gap-4 border-b border-border bg-muted/45 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground sm:grid-cols-[auto_110px_1fr_100px_120px]">
          <span>Select</span><span className="hidden sm:block">Code</span><span>Course</span><span className="hidden text-center sm:block">Credits</span><span className="text-right">Type</span>
        </div>
        {courses.map((course) => (
          <label key={course.offeringId} className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/25 sm:grid-cols-[auto_110px_1fr_100px_120px]">
            <input type="checkbox" className="h-5 w-5 accent-primary" checked={course.alreadyRegistered || selected.has(course.offeringId)} disabled={course.alreadyRegistered || pending} onChange={() => toggle(course.offeringId)} />
            <span className="hidden font-mono text-sm font-bold text-primary sm:block">{course.courseCode}</span>
            <span><span className="block text-sm font-semibold text-navy">{course.courseTitle}</span><span className="mt-1 block text-xs text-muted-foreground sm:hidden">{course.courseCode} · {course.creditHours} credits</span></span>
            <span className="hidden text-center text-sm font-semibold text-muted-foreground sm:block">{course.creditHours}</span>
            <span className="text-right text-xs font-semibold capitalize text-navy">{course.alreadyRegistered ? <span className="inline-flex items-center gap-1 text-success"><LockKeyhole className="h-3 w-3" />{course.registrationStatus === "submitted" ? "Pending review" : "Registered"}</span> : course.registrationType}</span>
          </label>
        ))}
      </div>
      {(error || message) && <p role="status" className={`rounded-xl px-4 py-3 text-sm font-medium ${error ? "bg-danger/8 text-danger" : "bg-success/8 text-success"}`}>{error ?? message}</p>}
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-primary p-5 text-white sm:flex-row sm:items-center">
        <div><p className="text-sm font-semibold">{selected.size} course{selected.size === 1 ? "" : "s"} selected</p><p className="mt-1 text-xs text-white/60">Your selection will be submitted to the Registrar for confirmation.</p></div>
        <Button onClick={submit} disabled={pending || selected.size === 0} className="min-h-11 bg-white text-primary hover:bg-white/90">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Confirm Course Registration
        </Button>
      </div>
    </div>
  );
}
