# Zomba Theological University Portal MVP

Secure Next.js MVP for the ZTU public website, Student Portal, Staff Portal, and shared Supabase backend.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://127.0.0.1:3000`.

## Required Environment

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` is used only in server routes for administrator account invitations. Never expose it to browser code.

## Supabase Setup

Apply:

```bash
supabase db push
```

Main migration:

```text
supabase/migrations/20260710190000_init_portal.sql
```

Demo seed scripts have been removed. Create live departments, programmes,
periods, accounts, and assignments from the Admin Portal.

## Verification

```bash
npm install --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
npm run build
```

## Local Routes

Public website: `/`

Student portal: `/student/login`, `/student/dashboard`, `/student/profile`, `/student/courses`, `/student/assessments`, `/student/results`, `/student/notices`, `/student/change-password`

Staff portal: `/staff/login`, `/staff/dashboard`, `/staff/courses`, `/staff/assessments`, `/staff/grades`, `/staff/approvals`, `/staff/results`, `/staff/students`, `/staff/users`, `/staff/audit-logs`

## Architecture Notes

See [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) for the architecture, RLS summary, permissions matrix, workflows, and deployment steps.
# ztu-portal
