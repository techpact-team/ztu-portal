# ZTU Portal Implementation Guide

## 1. Final Project Architecture

The project is one Next.js App Router application with public pages, a protected Student Portal, a protected Staff Portal, shared API route handlers, and one Supabase Auth/PostgreSQL identity system.

```text
Public website -> public routes
Student Portal -> Supabase Auth -> student RLS policies
Staff Portal -> Supabase Auth -> role/permission checks -> academic workflow APIs
Shared backend -> Next.js route handlers + Supabase server client
Shared database -> Supabase PostgreSQL + RLS + audit logs
```

Public routes remain open. Student and staff routes are protected by `src/proxy.ts`, shared auth guards, and Supabase RLS.

## 2. Folder Structure

```text
src/app
  student, staff, api, public pages
src/components
  auth, layout, shared, staff, ui
src/features
  staff, students data readers
src/lib
  auth, constants, permissions, services, supabase, validation
src/types
  database, auth, academics
supabase
  migrations
```

## 3. Database Schema Summary

The migration creates profiles, roles, permissions, user role mappings, departments, programmes, courses, academic periods, course offerings, lecturer assignments, enrolments, assessments, grade entries, course results, grade correction requests, announcements, audit logs, and grading scales.

Important uniqueness rules are enforced for role assignment, lecturer assignment, student enrolment per offering, grade per assessment/enrolment, course result per enrolment, course codes, programme codes, department codes, and academic periods.

## 4. Supabase Migration Files

Main schema and RLS:

```text
supabase/migrations/20260710190000_init_portal.sql
```

Demo seed files are intentionally excluded. Live records are created through the Admin Portal.

## 5. RLS Policy Summary

RLS is enabled on sensitive tables. Helper functions include:

```text
current_profile_id()
current_student_id()
current_staff_id()
has_role(role_name)
has_permission(permission_code)
is_assigned_lecturer(course_offering_id)
belongs_to_department(department_id)
```

Students can read only their own profile, enrolments, assessment entries, and published results. Lecturers can work only on assigned course offerings and draft/rejected grades. Heads of Department can approve submitted results. Registrars can publish approved results and review corrections. System administrators can manage accounts and roles but do not receive grade modification permissions by default.

## 6. Roles and Permissions Matrix

Student: profile, own courses, own assessments, own published results, notices, password change.

Lecturer: assigned courses, assigned enrolments, assessment creation/update, draft grade entry/update, grade submission.

Head of Department: department course/grade review, grade approval/rejection.

Registrar: students, programmes, courses, enrolments, results review/publication, grade correction approval, academic periods.

System Administrator: user creation/disablement, role assignment, permission management, system configuration, audit log reading.

## 7. Authentication Flow

Administrators create users through `/staff/users`, which uses the Supabase service role only on the server to send an activation invitation. Users sign in through `/student/login` or `/staff/login`. The login route verifies Supabase Auth, loads the database profile and roles by authenticated user ID, checks account status, then redirects to the correct portal.

## 8. Grade Workflow

```text
draft -> submitted -> approved -> published
```

Additional states:

```text
rejected, correction_requested, corrected
```

Grade calculations are centralized in `src/lib/services/grade-service.ts` and `src/lib/services/result-service.ts`.

## 9. Grade Correction Workflow

Published results are not overwritten directly. Correction requests are created through `/api/results/corrections`, preserving the old score and reason. Registrar review happens through `/api/results/corrections/review`, which records the decision and writes an audit event.

## 10. Audit Logging Approach

Sensitive actions call `recordAuditEvent()` and write to `audit_logs`. RLS allows normal users to insert audit events for themselves and only users with `audit_logs.read` can read logs.

Audited actions include account creation, password changes, assessment creation, grade draft saves, grade submission, grade approval/rejection, result publication, and grade correction request/review.

## 11. Environment Variables Required

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## 12. Local Development Instructions

```bash
npm install
cp .env.example .env.local
supabase db push
npm run dev
```

Without Supabase variables, public pages still work and protected portal routes show a setup-required screen.

## 13. Deployment Instructions

Deploy the Next.js app to Netlify. Configure the same environment variables in Netlify and apply Supabase migrations. Use custom domains later:

```text
www.ztu.ac.mw -> public website
students.ztu.ac.mw -> /student
staff.ztu.ac.mw -> /staff
```

## 14. Live Account Testing

Use the retained bootstrap System Administrator to create each live account and
academic record from the Admin Portal. No student, lecturer, Registrar, course,
programme, period, grade, or notice demo records are installed by the project.

## 15. Testing Checklist

Implemented automated unit coverage for grade calculations, grade transitions, portal access, disabled-user blocking, lecturer draft restrictions, HOD approval restrictions, registrar publication restrictions, and system-admin separation from academic grade permissions.

Manual/integration checklist after Supabase connection:

```text
student can view own profile
student cannot view another student
student cannot update grades
student cannot access staff pages
lecturer can view assigned course
lecturer cannot view unassigned course
lecturer can edit draft grade
lecturer cannot edit published grade
HOD can approve department grades
HOD cannot approve another department
registrar can publish approved grades
registrar cannot publish draft grades
published results appear in student portal
unpublished results remain hidden
disabled user cannot access portal
role change is audit logged
grade correction preserves previous value
direct API manipulation returns 403
resource ID tampering does not expose records
RLS blocks unauthorized direct database access
```

## 16. Remaining Non-MVP Features

Online fee payment, hostel management, library system, alumni portal, parent portal, e-learning video platform, biometric login, mobile application, advanced analytics, messaging, timetable generation, complex document workflows, multi-campus support, and AI recommendations remain out of scope.

## 17. Known Limitations

The staff administration UI currently creates users and assigns initial roles, but programme/course/period/offering creation screens are represented by APIs/data structures and migrations rather than full CRUD forms. Full end-to-end RLS verification requires a live Supabase project. Department-scoped approval policies should be expanded with stricter SQL checks before production.

## 18. Security Review Summary

The implementation uses Supabase Auth, secure server clients, no frontend service-role key exposure, environment validation, route protection, shared role/permission guards, RLS, Zod validation, rate limiting for login, CSP/security headers, server-side grade calculations, non-silent correction flow, and audit logging.
