"use client";

import { Save, Search, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { GradeEntryRowView } from "@/features/staff/staff-data";

type GradeEntryFormValues = {
  grades: Array<{
    registrationNumber: string;
    rawScore: string;
  }>;
};

type GradeEntryFormProps = {
  assessmentId: string;
  maximumScore: number;
  rows: GradeEntryRowView[];
};

export function GradeEntryForm({
  assessmentId,
  maximumScore,
  rows,
}: GradeEntryFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const form = useForm<GradeEntryFormValues>({
    defaultValues: {
      grades: rows.map((row) => ({
        registrationNumber: row.registrationNumber,
        rawScore: row.rawScore?.toString() ?? "",
      })),
    },
  });
  const fields = useFieldArray({ control: form.control, name: "grades" });

  function saveDraft(values: GradeEntryFormValues) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          grades: values.grades.map((grade) => ({
            registrationNumber: grade.registrationNumber,
            rawScore: Number(grade.rawScore),
          })),
        }),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to save grades.");
        return;
      }

      setMessage(payload.message ?? "Draft grades saved.");
      router.refresh();
    });
  }

  function submitForApproval() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch(`/api/grades/${assessmentId}/submit`, {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to submit grades.");
        return;
      }

      setMessage(payload.message ?? "Grades submitted.");
      router.refresh();
    });
  }

  return (
    <form className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" onSubmit={form.handleSubmit(saveDraft)}>
      {message ? (
        <div className="m-5 rounded-md bg-green-50 p-3 text-sm font-medium text-success">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="m-5 rounded-md bg-red-50 p-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}
      <div className="border-b border-border bg-muted/35 p-5">
        <label className="relative block max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Find student by registration number or name</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find by registration number or student name" className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-4 text-sm font-semibold text-navy outline-none focus:border-primary" />
        </label>
      </div>
      <div className="hidden grid-cols-[1fr_1.4fr_0.8fr_0.8fr] gap-4 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
        <span>Registration number</span>
        <span>Student</span>
        <span>Score</span>
        <span>Status</span>
      </div>
      {fields.fields.map((field, index) => {
        const row = rows[index];
        const matchesSearch = !search.trim() || `${row.registrationNumber} ${row.studentName}`.toLowerCase().includes(search.trim().toLowerCase());

        if (!matchesSearch) return null;

        return (
          <div
            key={field.id}
            className="grid gap-3 border-b border-border px-5 py-4 last:border-b-0 md:grid-cols-[1fr_1.4fr_0.8fr_0.8fr] md:items-center"
          >
            <input type="hidden" {...form.register(`grades.${index}.registrationNumber`)} />
            <p className="font-mono text-sm font-extrabold text-primary">{row.registrationNumber}</p>
            <p>{row.studentName}</p>
            <label className="grid gap-1 text-sm font-semibold text-navy">
              <span className="md:sr-only">Score</span>
              <input
                type="number"
                min={0}
                max={maximumScore}
                step="0.01"
                required
                className="h-10 rounded-md border border-border px-3"
                {...form.register(`grades.${index}.rawScore`)}
              />
            </label>
            <p className="text-sm text-muted-foreground">{row.status}</p>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-3 p-5">
        <Button type="submit" disabled={pending || rows.length === 0}>
          <Save className="h-4 w-4" />
          {pending ? "Saving..." : "Save draft"}
        </Button>
        <Button
          variant="secondary"
          disabled={pending || rows.length === 0}
          onClick={submitForApproval}
        >
          <Send className="h-4 w-4" />
          Submit assessment results
        </Button>
      </div>
    </form>
  );
}
