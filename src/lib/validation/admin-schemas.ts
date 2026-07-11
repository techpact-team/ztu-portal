import { z } from "zod";
import { ROLE_NAMES } from "@/lib/constants/roles";

export const userCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  middleName: z.string().optional(),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(ROLE_NAMES),
  registrationNumber: z.string().optional(),
  staffNumber: z.string().optional(),
  programmeId: z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, "Invalid UUID").optional(),
  departmentId: z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, "Invalid UUID").optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
