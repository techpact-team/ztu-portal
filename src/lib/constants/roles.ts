export const ROLE_NAMES = [
  "student",
  "lecturer",
  "head_of_department",
  "registrar",
  "system_administrator",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

export const ROLE_LABELS: Record<RoleName, string> = {
  student: "Student",
  lecturer: "Lecturer",
  head_of_department: "Head of Department",
  registrar: "Registrar",
  system_administrator: "System Administrator",
};

export const STAFF_ROLES: RoleName[] = [
  "lecturer",
  "head_of_department",
  "registrar",
  "system_administrator",
];
