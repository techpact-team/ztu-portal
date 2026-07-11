import { z } from "zod";

const uuidSchema = z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, "Invalid UUID");

export const assessmentCreateSchema = z.object({
  courseOfferingId: uuidSchema,
  name: z.string().min(2, "Assessment name is required.").max(120),
  assessmentType: z.string().min(2).max(80),
  maximumScore: z.coerce.number().positive("Maximum score must be greater than 0."),
  weightPercentage: z.coerce
    .number()
    .min(0, "Weight cannot be negative.")
    .max(100, "Weight cannot exceed 100."),
});

export type AssessmentCreateInput = z.infer<typeof assessmentCreateSchema>;
export type AssessmentCreateFormInput = z.input<typeof assessmentCreateSchema>;
