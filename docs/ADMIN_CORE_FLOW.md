# ZTU administration core flow

## Role ownership

| Role | Owns | Must not do |
|---|---|---|
| System Administrator | Accounts, roles, departments, programmes, periods, courses, offerings, registration windows, lecturer assignments, student setup, security | Enter, approve, publish, or correct grades |
| Student | Select and submit eligible courses; view submitted assessments and released final grades | Create accounts or edit academic records |
| Lecturer | Access assigned offerings; create assessments; enter and submit marks | Access unassigned classes or publish results |
| Registrar | Confirm/reject course registrations; approve and publish official results | Configure system access or enter lecturer marks |

## Administrator sequence

1. Sign in with the System Administrator account and open **Admin Overview**.
2. Open **Accounts & Roles**:
   - Create student accounts with a registration number and programme.
   - Create staff accounts with a staff number and department.
   - Activate the account after the invitation is accepted.
   - Disable suspicious or inactive accounts, send password resets, or replace a role.
3. Open **Academic Structure** and create records in dependency order:
   - Department
   - Programme
   - Course
   - Academic period
   - Course offering, including programme, year, and compulsory/elective type
4. Open **Registration Periods**:
   - Choose a deadline and open registration.
   - Close registration when required.
   - Set a new deadline and use Reopen only after authorization.
5. Open **Lecturer Assignments** and connect a lecturer to a course offering. Remove the old assignment before replacing a lecturer.
6. Open **Student Setup** to correct programme, year of study, or academic status.
7. Open **Audit & Security** to review login failures, role changes, account activity, configuration changes, and assignments.

## End-to-end academic sequence

1. Admin creates the accounts and configures the academic environment.
2. Admin opens registration and makes offerings available.
3. Student submits compulsory courses and selected electives.
4. Registrar confirms or rejects each submitted course.
5. Confirmed courses appear under **My Registered Courses**.
6. Lecturer creates assessments and submits student marks by registration number.
7. Submitted assessment marks appear under **My Assessments**.
8. Registrar approves final semester results.
9. Approved results appear under **My Grades** and may be formally published.

## Security guarantees

- Registration number and staff number are unique.
- One student profile and one staff profile may exist per account.
- Duplicate course registrations are blocked by a database constraint.
- Student registration is constrained by active status, programme, year, offering, open period, and deadline.
- Lecturer access is constrained to assigned offerings.
- Admin receives no grade-entry, grade-approval, result-publication, or published-grade correction permission.
- Authentication attempts and sensitive changes are added to the audit log.
