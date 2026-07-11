"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { AdminPortalData } from "@/features/admin/admin-data";

function Field({ name, label, type = "text", required = true, min }: { name: string; label: string; type?: string; required?: boolean; min?: number }) {
  return <label className="grid gap-1.5 text-sm font-bold text-navy">{label}<input name={name} type={type} required={required} min={min} className="h-11 rounded-xl border border-border px-3 font-medium outline-none focus:border-primary" /></label>;
}

function Select({ name, label, options }: { name: string; label: string; options: Array<{ id: string; label: string }> }) {
  return <label className="grid gap-1.5 text-sm font-bold text-navy">{label}<select name={name} required className="h-11 rounded-xl border border-border bg-white px-3 font-medium"><option value="">Select</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
}

export function AcademicSetupForms({ data }: { data: AdminPortalData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function submit(entity: string, form: HTMLFormElement) {
    const values = Object.fromEntries(new FormData(form));
    setMessage(null);
    startTransition(async () => {
      const response = await fetch("/api/admin/academic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entity, ...values }) });
      const result = await response.json() as { error?: string; message?: string };
      setMessage(result.error ?? result.message ?? null);
      if (response.ok) { form.reset(); router.refresh(); }
    });
  }

  const departments = data.departments.map((item) => ({ id: item.id, label: `${item.code} — ${item.name}` }));
  const programmes = data.programmes.map((item) => ({ id: item.id, label: `${item.code} — ${item.name}` }));
  const courses = data.courses.map((item) => ({ id: item.id, label: `${item.code} — ${item.title}` }));
  const periods = data.periods.map((item) => ({ id: item.id, label: `${item.academic_year} · Semester ${item.semester}` }));
  const card = "rounded-2xl border border-border bg-white p-5 shadow-sm";

  return <div className="space-y-5">
    {message ? <p className="rounded-xl bg-muted px-4 py-3 text-sm font-bold text-navy">{message}</p> : null}
    <div className="grid gap-5 xl:grid-cols-2">
      <form className={card} onSubmit={(event) => { event.preventDefault(); submit("department", event.currentTarget); }}><h2 className="mb-4 text-lg font-extrabold text-navy">1. Department</h2><div className="grid gap-4 sm:grid-cols-2"><Field name="name" label="Department name" /><Field name="code" label="Code" /></div><Button className="mt-5" type="submit" disabled={pending}>Create department</Button></form>
      <form className={card} onSubmit={(event) => { event.preventDefault(); submit("programme", event.currentTarget); }}><h2 className="mb-4 text-lg font-extrabold text-navy">2. Programme</h2><div className="grid gap-4 sm:grid-cols-2"><Select name="departmentId" label="Department" options={departments} /><Field name="name" label="Programme name" /><Field name="code" label="Code" /><Field name="durationYears" label="Duration (years)" type="number" min={1} /></div><Button className="mt-5" type="submit" disabled={pending}>Create programme</Button></form>
      <form className={card} onSubmit={(event) => { event.preventDefault(); submit("course", event.currentTarget); }}><h2 className="mb-4 text-lg font-extrabold text-navy">3. Course</h2><div className="grid gap-4 sm:grid-cols-2"><Select name="departmentId" label="Department" options={departments} /><Select name="programmeId" label="Programme" options={programmes} /><Field name="code" label="Course code" /><Field name="title" label="Course title" /><Field name="creditHours" label="Credit hours" type="number" min={1} /><Field name="courseLevel" label="Year / level" type="number" min={1} /></div><Button className="mt-5" type="submit" disabled={pending}>Create course</Button></form>
      <form className={card} onSubmit={(event) => { event.preventDefault(); submit("period", event.currentTarget); }}><h2 className="mb-4 text-lg font-extrabold text-navy">4. Academic period</h2><div className="grid gap-4 sm:grid-cols-2"><Field name="academicYear" label="Academic year" /><Field name="semester" label="Semester" type="number" min={1} /><Field name="startDate" label="Start date" type="date" /><Field name="endDate" label="End date" type="date" /></div><Button className="mt-5" type="submit" disabled={pending}>Create period</Button></form>
      <form className={`${card} xl:col-span-2`} onSubmit={(event) => { event.preventDefault(); submit("offering", event.currentTarget); }}><h2 className="mb-4 text-lg font-extrabold text-navy">5. Course offering</h2><div className="grid gap-4 md:grid-cols-3"><Select name="courseId" label="Course" options={courses} /><Select name="academicPeriodId" label="Academic period" options={periods} /><Select name="programmeId" label="Programme" options={programmes} /><Field name="yearOfStudy" label="Year of study" type="number" min={1} /><label className="grid gap-1.5 text-sm font-bold text-navy">Registration type<select name="registrationType" className="h-11 rounded-xl border border-border bg-white px-3"><option value="compulsory">Compulsory</option><option value="elective">Elective</option></select></label></div><Button className="mt-5" type="submit" disabled={pending}>Make course available</Button></form>
    </div>
    <section className={card}><h2 className="text-lg font-extrabold text-navy">Configured offerings</h2><div className="mt-4 divide-y divide-border">{data.offerings.map((offering) => <div key={offering.id} className="grid gap-1 py-3 text-sm md:grid-cols-[1.4fr_1.4fr_1fr_auto]"><strong className="text-navy">{offering.courseLabel}</strong><span>{offering.programmeLabel}</span><span>{offering.periodLabel}</span><span className="font-bold capitalize text-primary">Year {offering.year_of_study} · {offering.registration_type}</span></div>)}</div></section>
  </div>;
}
