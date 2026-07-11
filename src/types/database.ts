export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  auth_user_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string;
  phone: string | null;
  account_status: string;
  created_at: string;
  updated_at: string;
};

export type RoleRow = {
  id: string;
  name: string;
  display_name: string;
  description: string | null;
};

export type PermissionRow = {
  id: string;
  code: string;
  description: string | null;
};

export type UserRoleRow = {
  id: string;
  profile_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
};

export type RolePermissionRow = {
  id: string;
  role_id: string;
  permission_id: string;
};

export type DepartmentRow = {
  id: string;
  name: string;
  code: string;
};

export type ProgrammeRow = {
  id: string;
  department_id: string | null;
  name: string;
  code: string;
  duration_years: number;
  status: string;
};

export type CourseRow = {
  id: string;
  programme_id: string | null;
  department_id: string | null;
  code: string;
  title: string;
  credit_hours: number;
  course_level: number | null;
  status: string;
};

export type AcademicPeriodRow = {
  id: string;
  academic_year: string;
  semester: number;
  start_date: string | null;
  end_date: string | null;
  grading_open: boolean;
  results_published: boolean;
  registration_open: boolean;
  registration_deadline: string | null;
  status: string;
};

export type StudentRow = {
  id: string;
  profile_id: string;
  registration_number: string;
  programme_id: string;
  year_of_study: number;
  admission_date: string | null;
  student_status: string;
};

export type StaffMemberRow = {
  id: string;
  profile_id: string;
  staff_number: string;
  department_id: string | null;
  job_title: string | null;
  staff_status: string;
};

export type CourseOfferingRow = {
  id: string;
  course_id: string;
  academic_period_id: string;
  programme_id: string | null;
  year_of_study: number | null;
  status: string;
  registration_type: string;
};

export type LecturerAssignmentRow = {
  id: string;
  course_offering_id: string;
  staff_member_id: string;
  assigned_by: string | null;
  assigned_at: string;
};

export type EnrollmentRow = {
  id: string;
  student_id: string;
  course_offering_id: string;
  enrollment_status: string;
  enrolled_at: string;
};

export type AssessmentRow = {
  id: string;
  course_offering_id: string;
  name: string;
  assessment_type: string;
  maximum_score: number;
  weight_percentage: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type GradeEntryRow = {
  id: string;
  assessment_id: string;
  enrollment_id: string;
  raw_score: number;
  status: string;
  version: number;
  entered_by: string;
  entered_at: string;
  updated_by: string | null;
  updated_at: string | null;
};

export type CourseResultRow = {
  id: string;
  enrollment_id: string;
  continuous_assessment_score: number | null;
  examination_score: number | null;
  final_score: number | null;
  letter_grade: string | null;
  grade_point: number | null;
  result_status: string;
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  published_by: string | null;
  published_at: string | null;
};

export type GradeChangeRequestRow = {
  id: string;
  course_result_id: string;
  requested_by: string;
  old_score: number;
  requested_score: number;
  reason: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  audience: string;
  published: boolean;
  published_at: string | null;
  created_by: string;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  actor_profile_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type GradingScaleRow = {
  id: string;
  min_score: number;
  max_score: number;
  letter_grade: string;
  grade_point: number;
  active: boolean;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      roles: Table<RoleRow>;
      permissions: Table<PermissionRow>;
      user_roles: Table<UserRoleRow>;
      role_permissions: Table<RolePermissionRow>;
      students: Table<StudentRow>;
      staff_members: Table<StaffMemberRow>;
      departments: Table<DepartmentRow>;
      programmes: Table<ProgrammeRow>;
      courses: Table<CourseRow>;
      academic_periods: Table<AcademicPeriodRow>;
      course_offerings: Table<CourseOfferingRow>;
      lecturer_assignments: Table<LecturerAssignmentRow>;
      enrollments: Table<EnrollmentRow>;
      assessments: Table<AssessmentRow>;
      grade_entries: Table<GradeEntryRow>;
      course_results: Table<CourseResultRow>;
      grade_change_requests: Table<GradeChangeRequestRow>;
      announcements: Table<AnnouncementRow>;
      audit_logs: Table<AuditLogRow>;
      grading_scales: Table<GradingScaleRow>;
    };
    Views: Record<string, never>;
    Functions: {
      current_profile_id: { Args: Record<string, never>; Returns: string };
      current_student_id: { Args: Record<string, never>; Returns: string };
      current_staff_id: { Args: Record<string, never>; Returns: string };
      has_role: { Args: { role_name: string }; Returns: boolean };
      has_permission: {
        Args: { permission_code: string };
        Returns: boolean;
      };
      is_assigned_lecturer: {
        Args: { offering_id: string };
        Returns: boolean;
      };
      belongs_to_department: {
        Args: { target_department_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
