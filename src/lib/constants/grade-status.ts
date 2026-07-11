export const GRADE_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "published",
  "rejected",
  "correction_requested",
  "corrected",
] as const;

export type GradeStatus = (typeof GRADE_STATUSES)[number];

export const EDITABLE_DRAFT_STATUSES: GradeStatus[] = ["draft", "rejected"];
