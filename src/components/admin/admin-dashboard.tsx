import Link from "next/link";
import { ArrowRight, BookOpen, CalendarClock, GraduationCap, ScrollText, ShieldCheck, UserCog, Users } from "lucide-react";
import type { AdminPortalData } from "@/features/admin/admin-data";

const steps = [
  { number: "01", title: "Create and manage accounts", description: "Create students and staff, assign academic numbers, roles, and account access.", href: "/staff/users", icon: UserCog },
  { number: "02", title: "Set up academic structure", description: "Configure departments, programmes, periods, courses, levels, and offerings.", href: "/staff/admin/academic", icon: BookOpen },
  { number: "03", title: "Configure registration", description: "Open, close, set deadlines, or formally reopen student registration.", href: "/staff/admin/registration", icon: CalendarClock },
  { number: "04", title: "Assign lecturers", description: "Connect staff to the correct course offering, semester, programme, and class.", href: "/staff/admin/assignments", icon: Users },
  { number: "05", title: "Configure students", description: "Set each student’s programme, year of study, and academic status.", href: "/staff/admin/students", icon: GraduationCap },
  { number: "06", title: "Monitor security", description: "Review account changes, configuration activity, and protected system events.", href: "/staff/audit-logs", icon: ScrollText },
];

export function AdminDashboard({ data }: { data: AdminPortalData }) {
  return <div className="space-y-8">
    <section className="rounded-2xl bg-primary p-7 text-white shadow-sm"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10"><ShieldCheck className="h-6 w-6 text-white" /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/75">System Administrator</p><h2 className="mt-2 text-2xl font-black">Prepare and control the university system environment</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">Admin controls accounts, roles, academic configuration, registration availability, assignments, and security. Grade entry and official result release remain lecturer and Registrar responsibilities.</p></div></div></section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Accounts", data.accounts.length], ["Students", data.students.length], ["Course offerings", data.offerings.length], ["Lecturer assignments", data.assignments.length],
    ].map(([label, value]) => <div key={label} className="rounded-2xl border border-border bg-white p-5 shadow-sm"><p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-black text-navy">{value}</p></div>)}</div>
    <section><div className="mb-4"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-primary">Main core flow</p><h2 className="mt-1 text-2xl font-black text-navy">Administration sequence</h2></div><div className="grid gap-4 lg:grid-cols-2">{steps.map(({ number, title, description, href, icon: Icon }) => <Link key={href} href={href} className="group flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary"><span className="text-sm font-black text-primary">{number}</span><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block text-base font-black text-navy">{title}</strong><span className="mt-1 block text-sm leading-5 text-muted-foreground">{description}</span></span><ArrowRight className="mt-2 h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></Link>)}</div></section>
  </div>;
}
