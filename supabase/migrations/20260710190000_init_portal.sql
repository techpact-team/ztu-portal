create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null references auth.users(id) on delete cascade,
  first_name text not null,
  middle_name text,
  last_name text not null,
  email text not null,
  phone text,
  account_status text not null default 'pending'
    check (account_status in ('active', 'pending', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
    check (name in ('student', 'lecturer', 'head_of_department', 'registrar', 'system_administrator')),
  display_name text not null,
  description text
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique (profile_id, role_id)
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  unique (role_id, permission_id)
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  code text unique not null
);

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references public.departments(id),
  name text not null,
  code text unique not null,
  duration_years integer not null check (duration_years > 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived'))
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid references public.programmes(id),
  department_id uuid references public.departments(id),
  code text unique not null,
  title text not null,
  credit_hours numeric not null check (credit_hours > 0),
  course_level integer check (course_level is null or course_level > 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived'))
);

create table public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  academic_year text not null,
  semester integer not null check (semester in (1, 2, 3)),
  start_date date,
  end_date date,
  grading_open boolean not null default false,
  results_published boolean not null default false,
  status text not null default 'planned' check (status in ('planned', 'active', 'closed', 'archived')),
  unique (academic_year, semester)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  registration_number text unique not null,
  programme_id uuid not null references public.programmes(id),
  year_of_study integer not null check (year_of_study > 0),
  admission_date date,
  student_status text not null default 'active'
    check (student_status in ('active', 'graduated', 'withdrawn', 'suspended'))
);

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique not null references public.profiles(id) on delete cascade,
  staff_number text unique not null,
  department_id uuid references public.departments(id),
  job_title text,
  staff_status text not null default 'active'
    check (staff_status in ('active', 'inactive', 'disabled'))
);

create table public.course_offerings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  academic_period_id uuid not null references public.academic_periods(id),
  programme_id uuid references public.programmes(id),
  year_of_study integer check (year_of_study is null or year_of_study > 0),
  status text not null default 'active' check (status in ('active', 'closed', 'cancelled')),
  unique (course_id, academic_period_id, programme_id, year_of_study)
);

create table public.lecturer_assignments (
  id uuid primary key default gen_random_uuid(),
  course_offering_id uuid not null references public.course_offerings(id) on delete cascade,
  staff_member_id uuid not null references public.staff_members(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique (course_offering_id, staff_member_id)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_offering_id uuid not null references public.course_offerings(id) on delete cascade,
  enrollment_status text not null default 'active'
    check (enrollment_status in ('active', 'dropped', 'completed')),
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_offering_id)
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_offering_id uuid not null references public.course_offerings(id) on delete cascade,
  name text not null,
  assessment_type text not null,
  maximum_score numeric not null check (maximum_score > 0),
  weight_percentage numeric not null check (weight_percentage >= 0 and weight_percentage <= 100),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grade_entries (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  raw_score numeric not null check (raw_score >= 0),
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'published', 'rejected', 'correction_requested', 'corrected')),
  version integer not null default 1 check (version > 0),
  entered_by uuid not null references public.profiles(id),
  entered_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  updated_at timestamptz,
  unique (assessment_id, enrollment_id)
);

create table public.course_results (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid unique not null references public.enrollments(id) on delete cascade,
  continuous_assessment_score numeric,
  examination_score numeric,
  final_score numeric,
  letter_grade text,
  grade_point numeric,
  result_status text not null default 'draft'
    check (result_status in ('draft', 'submitted', 'approved', 'published', 'rejected', 'correction_requested', 'corrected')),
  submitted_by uuid references public.profiles(id),
  submitted_at timestamptz,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  published_by uuid references public.profiles(id),
  published_at timestamptz
);

create table public.grade_change_requests (
  id uuid primary key default gen_random_uuid(),
  course_result_id uuid not null references public.course_results(id) on delete cascade,
  requested_by uuid not null references public.profiles(id),
  old_score numeric not null,
  requested_score numeric not null,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  audience text not null check (audience in ('student', 'staff', 'all')),
  published boolean not null default false,
  published_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.grading_scales (
  id uuid primary key default gen_random_uuid(),
  min_score numeric not null check (min_score >= 0),
  max_score numeric not null check (max_score <= 100),
  letter_grade text not null,
  grade_point numeric not null check (grade_point >= 0),
  active boolean not null default true,
  check (min_score <= max_score),
  unique (min_score, max_score, letter_grade)
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger assessments_set_updated_at
before update on public.assessments
for each row execute function public.set_updated_at();

create index profiles_auth_user_id_idx on public.profiles(auth_user_id);
create index profiles_account_status_idx on public.profiles(account_status);
create index user_roles_profile_id_idx on public.user_roles(profile_id);
create index role_permissions_role_id_idx on public.role_permissions(role_id);
create index students_profile_id_idx on public.students(profile_id);
create index staff_members_profile_id_idx on public.staff_members(profile_id);
create index course_offerings_period_idx on public.course_offerings(academic_period_id);
create index lecturer_assignments_staff_idx on public.lecturer_assignments(staff_member_id);
create index enrollments_student_idx on public.enrollments(student_id);
create index enrollments_offering_idx on public.enrollments(course_offering_id);
create index assessments_offering_idx on public.assessments(course_offering_id);
create index grade_entries_assessment_idx on public.grade_entries(assessment_id);
create index grade_entries_enrollment_idx on public.grade_entries(enrollment_id);
create index course_results_status_idx on public.course_results(result_status);
create index audit_logs_actor_idx on public.audit_logs(actor_profile_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

create or replace function public.enforce_assessment_weight_limit()
returns trigger
language plpgsql
as $$
declare
  existing_weight numeric;
begin
  select coalesce(sum(weight_percentage), 0)
  into existing_weight
  from public.assessments
  where course_offering_id = new.course_offering_id
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
    and status <> 'archived';

  if existing_weight + new.weight_percentage > 100 then
    raise exception 'Total assessment weight for a course offering cannot exceed 100';
  end if;

  return new;
end;
$$;

create trigger assessments_weight_limit
before insert or update on public.assessments
for each row execute function public.enforce_assessment_weight_limit();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
    and account_status = 'active'
  limit 1;
$$;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select students.id
  from public.students
  join public.profiles on profiles.id = students.profile_id
  where profiles.auth_user_id = auth.uid()
    and profiles.account_status = 'active'
    and students.student_status = 'active'
  limit 1;
$$;

create or replace function public.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select staff_members.id
  from public.staff_members
  join public.profiles on profiles.id = staff_members.profile_id
  where profiles.auth_user_id = auth.uid()
    and profiles.account_status = 'active'
    and staff_members.staff_status = 'active'
  limit 1;
$$;

create or replace function public.has_role(role_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    join public.roles on roles.id = user_roles.role_id
    where user_roles.profile_id = public.current_profile_id()
      and roles.name = role_name
  );
$$;

create or replace function public.has_permission(permission_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    join public.role_permissions on role_permissions.role_id = user_roles.role_id
    join public.permissions on permissions.id = role_permissions.permission_id
    where user_roles.profile_id = public.current_profile_id()
      and permissions.code = permission_code
  );
$$;

create or replace function public.is_assigned_lecturer(offering_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.lecturer_assignments
    where lecturer_assignments.course_offering_id = offering_id
      and lecturer_assignments.staff_member_id = public.current_staff_id()
  );
$$;

create or replace function public.belongs_to_department(target_department_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_members
    where staff_members.id = public.current_staff_id()
      and staff_members.department_id = target_department_id
  );
$$;

insert into public.roles (name, display_name, description) values
  ('student', 'Student', 'Student portal account'),
  ('lecturer', 'Lecturer', 'Assigned course lecturer'),
  ('head_of_department', 'Head of Department', 'Department-level grade approver'),
  ('registrar', 'Registrar', 'Academic records publisher'),
  ('system_administrator', 'System Administrator', 'Technical account and permission administrator')
on conflict (name) do nothing;

insert into public.permissions (code, description) values
  ('profile.read_own', 'Read own profile'),
  ('courses.read_own', 'Read own registered courses'),
  ('assessments.read_own', 'Read own assessment scores'),
  ('results.read_published_own', 'Read own published results'),
  ('notices.read', 'Read notices'),
  ('password.change_own', 'Change own password'),
  ('courses.read_assigned', 'Read assigned courses'),
  ('enrolments.read_assigned', 'Read enrolments for assigned courses'),
  ('assessments.create_assigned', 'Create assessments for assigned courses'),
  ('assessments.update_assigned', 'Update assessments for assigned courses'),
  ('grades.create_assigned', 'Create grades for assigned courses'),
  ('grades.update_draft_assigned', 'Update draft grades for assigned courses'),
  ('grades.submit_assigned', 'Submit grades for assigned courses'),
  ('courses.read_department', 'Read department courses'),
  ('grades.read_department', 'Read department grades'),
  ('grades.approve_department', 'Approve department grades'),
  ('grades.reject_department', 'Reject department grades'),
  ('students.manage', 'Manage student records'),
  ('programmes.manage', 'Manage programmes'),
  ('courses.manage', 'Manage courses'),
  ('enrolments.manage', 'Manage enrolments'),
  ('results.review', 'Review results'),
  ('results.publish', 'Publish results'),
  ('grade_changes.approve', 'Approve grade corrections'),
  ('academic_periods.manage', 'Manage academic periods'),
  ('users.create', 'Create users'),
  ('users.disable', 'Disable users'),
  ('roles.assign', 'Assign roles'),
  ('permissions.manage', 'Manage permissions'),
  ('system.configure', 'Configure system settings'),
  ('audit_logs.read', 'Read audit logs')
on conflict (code) do nothing;

insert into public.role_permissions (role_id, permission_id)
select roles.id, permissions.id
from public.roles
join public.permissions on permissions.code = any (
  case roles.name
    when 'student' then array[
      'profile.read_own', 'courses.read_own', 'assessments.read_own',
      'results.read_published_own', 'notices.read', 'password.change_own'
    ]
    when 'lecturer' then array[
      'courses.read_assigned', 'enrolments.read_assigned',
      'assessments.create_assigned', 'assessments.update_assigned',
      'grades.create_assigned', 'grades.update_draft_assigned',
      'grades.submit_assigned'
    ]
    when 'head_of_department' then array[
      'courses.read_department', 'grades.read_department',
      'grades.approve_department', 'grades.reject_department'
    ]
    when 'registrar' then array[
      'students.manage', 'programmes.manage', 'courses.manage',
      'enrolments.manage', 'results.review', 'results.publish',
      'grade_changes.approve', 'academic_periods.manage'
    ]
    when 'system_administrator' then array[
      'users.create', 'users.disable', 'roles.assign',
      'permissions.manage', 'system.configure', 'audit_logs.read'
    ]
    else array[]::text[]
  end
)
on conflict (role_id, permission_id) do nothing;

insert into public.grading_scales (min_score, max_score, letter_grade, grade_point) values
  (80, 100, 'A', 4.0),
  (75, 79, 'A-', 3.7),
  (70, 74, 'B+', 3.3),
  (65, 69, 'B', 3.0),
  (60, 64, 'B-', 2.7),
  (55, 59, 'C+', 2.3),
  (50, 54, 'C', 2.0),
  (45, 49, 'D', 1.0),
  (0, 44, 'F', 0.0)
on conflict (min_score, max_score, letter_grade) do nothing;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.departments enable row level security;
alter table public.programmes enable row level security;
alter table public.courses enable row level security;
alter table public.academic_periods enable row level security;
alter table public.students enable row level security;
alter table public.staff_members enable row level security;
alter table public.course_offerings enable row level security;
alter table public.lecturer_assignments enable row level security;
alter table public.enrollments enable row level security;
alter table public.assessments enable row level security;
alter table public.grade_entries enable row level security;
alter table public.course_results enable row level security;
alter table public.grade_change_requests enable row level security;
alter table public.announcements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.grading_scales enable row level security;

create policy profiles_select on public.profiles
for select to authenticated
using (
  id = public.current_profile_id()
  or public.has_permission('users.create')
  or public.has_permission('students.manage')
);

create policy profiles_admin_insert on public.profiles
for insert to authenticated
with check (public.has_permission('users.create'));

create policy roles_select on public.roles
for select to authenticated using (true);

create policy permissions_select on public.permissions
for select to authenticated using (true);

create policy user_roles_select on public.user_roles
for select to authenticated
using (profile_id = public.current_profile_id() or public.has_permission('roles.assign'));

create policy user_roles_admin_write on public.user_roles
for all to authenticated
using (public.has_permission('roles.assign'))
with check (public.has_permission('roles.assign'));

create policy role_permissions_select on public.role_permissions
for select to authenticated using (true);

create policy reference_data_select on public.departments
for select to authenticated using (true);

create policy programmes_select on public.programmes
for select to authenticated using (true);

create policy courses_select on public.courses
for select to authenticated using (true);

create policy academic_periods_select on public.academic_periods
for select to authenticated using (true);

create policy academic_admin_departments on public.departments
for all to authenticated
using (public.has_permission('programmes.manage'))
with check (public.has_permission('programmes.manage'));

create policy academic_admin_programmes on public.programmes
for all to authenticated
using (public.has_permission('programmes.manage'))
with check (public.has_permission('programmes.manage'));

create policy academic_admin_courses on public.courses
for all to authenticated
using (public.has_permission('courses.manage'))
with check (public.has_permission('courses.manage'));

create policy academic_admin_periods on public.academic_periods
for all to authenticated
using (public.has_permission('academic_periods.manage'))
with check (public.has_permission('academic_periods.manage'));

create policy students_select on public.students
for select to authenticated
using (
  profile_id = public.current_profile_id()
  or public.has_permission('students.manage')
  or exists (
    select 1
    from public.enrollments
    where enrollments.student_id = students.id
      and public.is_assigned_lecturer(enrollments.course_offering_id)
  )
);

create policy students_manage on public.students
for all to authenticated
using (public.has_permission('students.manage'))
with check (public.has_permission('students.manage'));

create policy staff_members_select on public.staff_members
for select to authenticated
using (
  profile_id = public.current_profile_id()
  or public.has_permission('users.create')
  or public.has_permission('courses.manage')
);

create policy staff_members_manage on public.staff_members
for all to authenticated
using (public.has_permission('users.create'))
with check (public.has_permission('users.create'));

create policy course_offerings_select on public.course_offerings
for select to authenticated
using (
  public.has_permission('courses.manage')
  or public.is_assigned_lecturer(id)
  or exists (
    select 1 from public.enrollments
    where enrollments.course_offering_id = course_offerings.id
      and enrollments.student_id = public.current_student_id()
  )
);

create policy course_offerings_manage on public.course_offerings
for all to authenticated
using (public.has_permission('courses.manage'))
with check (public.has_permission('courses.manage'));

create policy lecturer_assignments_select on public.lecturer_assignments
for select to authenticated
using (
  staff_member_id = public.current_staff_id()
  or public.has_permission('courses.manage')
);

create policy lecturer_assignments_manage on public.lecturer_assignments
for all to authenticated
using (public.has_permission('courses.manage'))
with check (public.has_permission('courses.manage'));

create policy enrollments_select on public.enrollments
for select to authenticated
using (
  student_id = public.current_student_id()
  or public.has_permission('enrolments.manage')
  or public.is_assigned_lecturer(course_offering_id)
);

create policy enrollments_manage on public.enrollments
for all to authenticated
using (public.has_permission('enrolments.manage'))
with check (public.has_permission('enrolments.manage'));

create policy assessments_select on public.assessments
for select to authenticated
using (
  public.is_assigned_lecturer(course_offering_id)
  or public.has_permission('results.review')
  or exists (
    select 1 from public.enrollments
    where enrollments.course_offering_id = assessments.course_offering_id
      and enrollments.student_id = public.current_student_id()
  )
);

create policy assessments_lecturer_insert on public.assessments
for insert to authenticated
with check (
  public.has_permission('assessments.create_assigned')
  and public.is_assigned_lecturer(course_offering_id)
  and created_by = public.current_profile_id()
);

create policy assessments_lecturer_update on public.assessments
for update to authenticated
using (
  public.has_permission('assessments.update_assigned')
  and public.is_assigned_lecturer(course_offering_id)
)
with check (
  public.has_permission('assessments.update_assigned')
  and public.is_assigned_lecturer(course_offering_id)
);

create policy grade_entries_select on public.grade_entries
for select to authenticated
using (
  exists (
    select 1 from public.enrollments
    where enrollments.id = grade_entries.enrollment_id
      and enrollments.student_id = public.current_student_id()
  )
  or exists (
    select 1 from public.assessments
    where assessments.id = grade_entries.assessment_id
      and public.is_assigned_lecturer(assessments.course_offering_id)
  )
  or public.has_permission('grades.read_department')
  or public.has_permission('results.review')
);

create policy grade_entries_lecturer_insert on public.grade_entries
for insert to authenticated
with check (
  public.has_permission('grades.create_assigned')
  and entered_by = public.current_profile_id()
  and exists (
    select 1 from public.assessments
    where assessments.id = grade_entries.assessment_id
      and public.is_assigned_lecturer(assessments.course_offering_id)
  )
);

create policy grade_entries_lecturer_update_draft on public.grade_entries
for update to authenticated
using (
  public.has_permission('grades.update_draft_assigned')
  and status in ('draft', 'rejected')
  and exists (
    select 1 from public.assessments
    where assessments.id = grade_entries.assessment_id
      and public.is_assigned_lecturer(assessments.course_offering_id)
  )
)
with check (
  public.has_permission('grades.update_draft_assigned')
  and exists (
    select 1 from public.assessments
    where assessments.id = grade_entries.assessment_id
      and public.is_assigned_lecturer(assessments.course_offering_id)
  )
);

create policy course_results_select on public.course_results
for select to authenticated
using (
  (
    result_status = 'published'
    and exists (
      select 1 from public.enrollments
      where enrollments.id = course_results.enrollment_id
        and enrollments.student_id = public.current_student_id()
    )
  )
  or public.has_permission('grades.read_department')
  or public.has_permission('results.review')
  or public.has_permission('results.publish')
  or exists (
    select 1
    from public.enrollments
    join public.course_offerings on course_offerings.id = enrollments.course_offering_id
    where enrollments.id = course_results.enrollment_id
      and public.is_assigned_lecturer(course_offerings.id)
  )
);

create policy course_results_staff_insert on public.course_results
for insert to authenticated
with check (
  public.has_permission('grades.submit_assigned')
  or public.has_permission('grades.approve_department')
  or public.has_permission('results.publish')
  or public.has_permission('grade_changes.approve')
);

create policy course_results_staff_update on public.course_results
for update to authenticated
using (
  public.has_permission('grades.submit_assigned')
  or public.has_permission('grades.approve_department')
  or public.has_permission('results.publish')
  or public.has_permission('grade_changes.approve')
)
with check (
  public.has_permission('grades.submit_assigned')
  or public.has_permission('grades.approve_department')
  or public.has_permission('results.publish')
  or public.has_permission('grade_changes.approve')
);

create policy grade_change_requests_select on public.grade_change_requests
for select to authenticated
using (
  requested_by = public.current_profile_id()
  or public.has_permission('grade_changes.approve')
  or public.has_permission('audit_logs.read')
);

create policy grade_change_requests_insert on public.grade_change_requests
for insert to authenticated
with check (requested_by = public.current_profile_id());

create policy grade_change_requests_review on public.grade_change_requests
for update to authenticated
using (public.has_permission('grade_changes.approve'))
with check (public.has_permission('grade_changes.approve'));

create policy announcements_select on public.announcements
for select to authenticated
using (
  published = true
  and (
    audience = 'all'
    or (audience = 'student' and public.has_role('student'))
    or (audience = 'staff' and not public.has_role('student'))
  )
);

create policy announcements_staff_manage on public.announcements
for all to authenticated
using (public.has_permission('system.configure') or public.has_permission('academic_periods.manage'))
with check (public.has_permission('system.configure') or public.has_permission('academic_periods.manage'));

create policy audit_logs_select on public.audit_logs
for select to authenticated
using (public.has_permission('audit_logs.read'));

create policy audit_logs_insert on public.audit_logs
for insert to authenticated
with check (actor_profile_id is null or actor_profile_id = public.current_profile_id());

create policy grading_scales_select on public.grading_scales
for select to authenticated using (active = true);

create policy grading_scales_manage on public.grading_scales
for all to authenticated
using (public.has_permission('academic_periods.manage'))
with check (public.has_permission('academic_periods.manage'));
