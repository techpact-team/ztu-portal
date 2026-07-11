import type { GradeStatus } from "@/lib/constants/grade-status";
import type { GradingBand } from "@/types/academics";

export const DEFAULT_GRADING_SCALE: GradingBand[] = [
  { minScore: 80, maxScore: 100, letterGrade: "A", gradePoint: 4.0 },
  { minScore: 75, maxScore: 79, letterGrade: "A-", gradePoint: 3.7 },
  { minScore: 70, maxScore: 74, letterGrade: "B+", gradePoint: 3.3 },
  { minScore: 65, maxScore: 69, letterGrade: "B", gradePoint: 3.0 },
  { minScore: 60, maxScore: 64, letterGrade: "B-", gradePoint: 2.7 },
  { minScore: 55, maxScore: 59, letterGrade: "C+", gradePoint: 2.3 },
  { minScore: 50, maxScore: 54, letterGrade: "C", gradePoint: 2.0 },
  { minScore: 45, maxScore: 49, letterGrade: "D", gradePoint: 1.0 },
  { minScore: 0, maxScore: 44, letterGrade: "F", gradePoint: 0 },
];

export function calculateWeightedScore({
  rawScore,
  maximumScore,
  weightPercentage,
}: {
  rawScore: number;
  maximumScore: number;
  weightPercentage: number;
}) {
  if (maximumScore <= 0) {
    throw new Error("Maximum score must be greater than 0.");
  }

  if (rawScore < 0 || rawScore > maximumScore) {
    throw new Error("Raw score must be between 0 and the maximum score.");
  }

  if (weightPercentage < 0 || weightPercentage > 100) {
    throw new Error("Assessment weight must be between 0 and 100.");
  }

  return (rawScore / maximumScore) * weightPercentage;
}

export function resolveGrade(
  finalScore: number,
  scale: GradingBand[] = DEFAULT_GRADING_SCALE,
) {
  const band = scale.find(
    (item) => finalScore >= item.minScore && finalScore <= item.maxScore,
  );

  if (!band) {
    throw new Error("No grading band matches the final score.");
  }

  return {
    letterGrade: band.letterGrade,
    gradePoint: band.gradePoint,
  };
}

export function assertAssessmentWeightLimit(
  existingWeight: number,
  newWeight: number,
) {
  if (existingWeight + newWeight > 100) {
    throw new Error("Total assessment weight for this course cannot exceed 100.");
  }
}

export function nextGradeStatus(
  current: GradeStatus,
  action: "submit" | "approve" | "reject" | "publish" | "request_correction" | "correct",
) {
  const transitions: Record<string, GradeStatus> = {
    "draft:submit": "submitted",
    "submitted:approve": "approved",
    "submitted:reject": "rejected",
    "approved:publish": "published",
    "published:request_correction": "correction_requested",
    "correction_requested:correct": "corrected",
    "corrected:publish": "published",
  };

  const next = transitions[`${current}:${action}`];

  if (!next) {
    throw new Error(`Cannot ${action} a ${current} grade.`);
  }

  return next;
}
