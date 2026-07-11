"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Gauge,
  GraduationCap,
  IdCard,
  ListChecks,
  LockKeyhole,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

export type PortalIconName =
  | "dashboard" | "profile" | "courses" | "assessments" | "results"
  | "notices" | "password" | "students" | "approvals" | "users" | "audit";

export type PortalNavItem = { href: string; label: string; icon: PortalIconName };

const icons: Record<PortalIconName, LucideIcon> = {
  dashboard: Gauge, profile: IdCard, courses: BookOpen,
  assessments: ClipboardCheck, results: GraduationCap, notices: ScrollText,
  password: LockKeyhole, students: Users, approvals: ListChecks,
  users: ShieldCheck, audit: ScrollText,
};

type PortalShellProps = {
  children: React.ReactNode;
  navItems: PortalNavItem[];
  portalLabel: string;
  userName: string;
  academicSession?: string;
  loginHref: string;
};

export function PortalShell({ children, navItems, portalLabel, userName, academicSession = "No active session", loginHref }: PortalShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <aside className="flex h-full w-[280px] flex-col bg-primary text-white">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <Image src="/ztu-seal.jpg" alt="ZTU seal" width={42} height={42} className="h-11 w-11 rounded-full border-2 border-white/15 object-cover" priority />
        <div>
          <p className="text-sm font-bold tracking-tight">Zomba Theological</p>
          <p className="text-xs text-white/55">University</p>
        </div>
      </div>

      <div className="px-5 pb-4 pt-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">{portalLabel}</p>
        <p className="mt-2 truncate text-sm font-semibold">{userName}</p>
        <p className="mt-0.5 text-xs text-white/50">Secure academic access</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label={`${portalLabel} navigation`}>
        {navItems.map((item) => {
          const Icon = icons[item.icon];
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={cn("group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-extrabold transition",
                active ? "bg-white text-navy shadow-sm" : "text-white/95 hover:bg-white/10 hover:text-white")}
            >
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", active ? "bg-primary/10 text-primary" : "bg-white/10 text-white/85 group-hover:text-white")}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4"><LogoutButton loginHref={loginHref} /></div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "block" : "hidden")}>
        <button className="absolute inset-0 bg-primary/55 backdrop-blur-sm" type="button" aria-label="Close navigation" onClick={() => setOpen(false)} />
        <div className="relative h-full w-[280px] shadow-2xl">{sidebar}</div>
      </div>
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>
      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-4">
            <button type="button" className="rounded-lg border border-border p-2.5 text-navy lg:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Current academic session</p>
              <p className="text-sm font-bold text-navy">{academicSession}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-navy">{userName}</p><p className="text-xs text-muted-foreground">{portalLabel.replace(" Portal", "")} account</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{userName.charAt(0)}</div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
