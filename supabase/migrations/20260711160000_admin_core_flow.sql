-- Admin owns technical and academic configuration, but not academic results.

alter table public.academic_periods
  add column if not exists registration_open boolean not null default false,
  add column if not exists registration_deadline date;

alter table public.course_offerings
  add column if not exists registration_type text not null default 'compulsory';

alter table public.course_offerings
  drop constraint if exists course_offerings_registration_type_check;
alter table public.course_offerings
  add constraint course_offerings_registration_type_check
  check (registration_type in ('compulsory', 'elective'));

alter table public.students
  drop constraint if exists students_student_status_check;
alter table public.students
  add constraint students_student_status_check
  check (student_status in ('active', 'graduated', 'completed', 'withdrawn', 'suspended'));

alter table public.enrollments
  drop constraint if exists enrollments_enrollment_status_check;
alter table public.enrollments
  add constraint enrollments_enrollment_status_check
  check (enrollment_status in ('submitted', 'active', 'rejected', 'dropped', 'completed'));

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'system_administrator'
  and p.code in (
    'students.manage',
    'programmes.manage',
    'courses.manage',
    'enrolments.manage',
    'academic_periods.manage'
  )
on conflict (role_id, permission_id) do nothing;

-- Official result review belongs to the Registrar, not technical Admin or HOD.
delete from public.role_permissions rp
using public.roles r, public.permissions p
where rp.role_id = r.id
  and rp.permission_id = p.id
  and r.name = 'head_of_department'
  and p.code in ('grades.approve_department', 'grades.reject_department');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.name = 'registrar'
  and p.code in ('grades.approve_department', 'grades.reject_department')
on conflict (role_id, permission_id) do nothing;

-- Students only see/register offerings while the configured window is open.
drop policy if exists course_offerings_student_eligible_select on public.course_offerings;
create policy course_offerings_student_eligible_select on public.course_offerings
for select to authenticated
using (
  status = 'active'
  and exists (
    select 1
    from public.students s
    join public.academic_periods ap on ap.id = course_offerings.academic_period_id
    where s.id = public.current_student_id()
      and s.student_status = 'active'
      and s.programme_id = course_offerings.programme_id
      and s.year_of_study = course_offerings.year_of_study
      and ap.status = 'active'
      and ap.registration_open = true
      and (ap.registration_deadline is null or current_date <= ap.registration_deadline)
  )
);

drop policy if exists enrollments_student_register on public.enrollments;
create policy enrollments_student_register on public.enrollments
for insert to authenticated
with check (
  student_id = public.current_student_id()
  and enrollment_status = 'submitted'
  and exists (
    select 1
    from public.students s
    join public.course_offerings co on co.id = enrollments.course_offering_id
    join public.academic_periods ap on ap.id = co.academic_period_id
    join public.courses c on c.id = co.course_id
    where s.id = public.current_student_id()
      and s.student_status = 'active'
      and co.status = 'active'
      and c.status = 'active'
      and co.programme_id = s.programme_id
      and co.year_of_study = s.year_of_study
      and ap.status = 'active'
      and ap.registration_open = true
      and (ap.registration_deadline is null or current_date <= ap.registration_deadline)
  )
);

create policy enrollments_student_resubmit_rejected on public.enrollments
for update to authenticated
using (
  student_id = public.current_student_id()
  and enrollment_status = 'rejected'
)
with check (
  student_id = public.current_student_id()
  and enrollment_status = 'submitted'
  and exists (
    select 1
    from public.students s
    join public.course_offerings co on co.id = enrollments.course_offering_id
    join public.academic_periods ap on ap.id = co.academic_period_id
    where s.id = public.current_student_id()
      and s.student_status = 'active'
      and co.status = 'active'
      and co.programme_id = s.programme_id
      and co.year_of_study = s.year_of_study
      and ap.status = 'active'
      and ap.registration_open = true
      and (ap.registration_deadline is null or current_date <= ap.registration_deadline)
  )
);
