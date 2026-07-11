"use client";

import { CheckCircle2, Send, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type WorkflowActionsProps = {
  courseResultId: string;
  mode: "approval" | "publish";
};

export function WorkflowActions({ courseResultId, mode }: WorkflowActionsProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function post(decision: "approve" | "reject" | "publish") {
    setError(null);
    startTransition(async () => {
      const endpoint =
        decision === "publish" ? "/api/results/publish" : "/api/grades/approvals";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          decision === "publish"
            ? { courseResultId }
            : { courseResultId, decision },
        ),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Action failed.");
        return;
      }

      router.refresh();
    });
  }

  if (mode === "publish") {
    return (
      <div className="grid gap-2">
        <Button disabled={pending} onClick={() => post("publish")}>
          <Send className="h-4 w-4" />
          Publish
        </Button>
        {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:flex sm:items-center">
      <Button disabled={pending} onClick={() => post("approve")}>
        <CheckCircle2 className="h-4 w-4" />
        Approve
      </Button>
      <Button variant="danger" disabled={pending} onClick={() => post("reject")}>
        <XCircle className="h-4 w-4" />
        Reject
      </Button>
      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
    </div>
  );
}
