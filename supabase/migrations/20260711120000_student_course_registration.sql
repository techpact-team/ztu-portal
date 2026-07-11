-- Student self-registration for the first MVP.
-- Registrations are auto-confirmed into enrollments when every eligibility rule passes.

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
  )
);

create policy enrollments_student_register on public.enrollments
for insert to authenticated
with check (
  student_id = public.current_student_id()
  and enrollment_status = 'active'
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
  )
);
