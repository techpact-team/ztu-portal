import { z } from "zod";

const uuidSchema = z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, "Invalid UUID");

export const gradeEntrySchema = z.object({
  registrationNumber: z.string().trim().min(3, "Registration number is required.").max(50),
  rawScore: z.coerce.number().min(0, "Score cannot be negative."),
});

export const gradeEntryBatchSchema = z.object({
  assessmentId: uuidSchema,
  grades: z.array(gradeEntrySchema).min(1, "Enter at least one grade."),
});

export const gradeApprovalSchema = z.object({
  courseResultId: uuidSchema,
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(500).optional(),
});

export const resultPublishSchema = z.object({
  courseResultId: uuidSchema,
});

export const gradeCorrectionRequestSchema = z.object({
  courseResultId: uuidSchema,
  requestedScore: z.coerce.number().min(0),
  reason: z.string().min(10, "A correction reason is required.").max(1000),
});

export const gradeCorrectionApprovalSchema = z.object({
  requestId: uuidSchema,
  decision: z.enum(["approve", "reject"]),
});

export type GradeEntryBatchInput = z.infer<typeof gradeEntryBatchSchema>;
