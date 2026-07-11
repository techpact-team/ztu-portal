import type { GradeStatus } from "@/lib/constants/grade-status";

export type AccountStatus = "active" | "pending" | "disabled";
export type StudentStatus = "active" | "graduated" | "withdrawn" | "suspended";
export type StaffStatus = "active" | "inactive" | "disabled";
export type ResultStatus = GradeStatus;

export type GradingBand = {
  minScore: number;
  maxScore: number;
  letterGrade: string;
  gradePoint: number;
};
