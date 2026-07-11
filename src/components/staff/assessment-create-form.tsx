"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  assessmentCreateSchema,
  type AssessmentCreateFormInput,
  type AssessmentCreateInput,
} from "@/lib/validation/assessment-schemas";

type CourseOption = {
  offeringId: string;
  label: string;
};

export function AssessmentCreateForm({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<AssessmentCreateFormInput, unknown, AssessmentCreateInput>({
    resolver: zodResolver(assessmentCreateSchema),
    defaultValues: {
      courseOfferingId: courses[0]?.offeringId ?? "",
      name: "",
      assessmentType: "coursework",
      maximumScore: 100,
      weightPercentage: 0,
    },
  });

  function onSubmit(values: AssessmentCreateInput) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(payload.error ?? "Unable to create assessment.");
        return;
      }

      form.reset({ ...values, name: "", weightPercentage: 0 });
      setMessage(payload.message ?? "Assessment created.");
      router.refresh();
    });
  }

  return (
    <form
      className="rounded-lg border border-border bg-card p-6"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      {message ? (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm font-medium text-success">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm font-medium text-danger">
          {error}
        </div>
      ) : null}
      <label className="grid gap-2 text-sm font-semibold text-navy">
        Course offering <span className="sr-only">required</span>
        <select
          className="h-11 rounded-md border border-border bg-card px-3 text-base font-normal"
          {...form.register("courseOfferingId")}
          required
        >
          {courses.map((course) => (
            <option key={course.offeringId} value={course.offeringId}>
              {course.label}
            </option>
          ))}
        </select>
      </label>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Input
          label="Assessment name"
          required
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />
        <Input
          label="Assessment type"
          required
          error={form.formState.errors.assessmentType?.message}
          {...form.register("assessmentType")}
        />
        <Input
          label="Maximum score"
          type="number"
          min={1}
          step="0.01"
          required
          error={form.formState.errors.maximumScore?.message}
          {...form.register("maximumScore")}
        />
        <Input
          label="Weight percentage"
          type="number"
          min={0}
          max={100}
          step="0.01"
          required
          error={form.formState.errors.weightPercentage?.message}
          {...form.register("weightPercentage")}
        />
      </div>
      <Button className="mt-6" type="submit" disabled={pending || courses.length === 0}>
        <Plus className="h-4 w-4" />
        {pending ? "Creating..." : "Create assessment"}
      </Button>
    </form>
  );
}
