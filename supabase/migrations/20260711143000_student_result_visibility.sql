-- Release assessment marks when a lecturer submits them, and final results when
-- an authorised academic reviewer approves them.

drop policy if exists grade_entries_select on public.grade_entries;
create policy grade_entries_select on public.grade_entries
for select to authenticated
using (
  (
    status in ('submitted', 'approved', 'published', 'corrected')
    and exists (
      select 1 from public.enrollments
      where enrollments.id = grade_entries.enrollment_id
        and enrollments.student_id = public.current_student_id()
    )
  )
  or exists (
    select 1 from public.assessments
    where assessments.id = grade_entries.assessment_id
      and public.is_assigned_lecturer(assessments.course_offering_id)
  )
  or public.has_permission('grades.read_department')
  or public.has_permission('results.review')
);

drop policy if exists course_results_select on public.course_results;
create policy course_results_select on public.course_results
for select to authenticated
using (
  (
    result_status in ('approved', 'published')
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
