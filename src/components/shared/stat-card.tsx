import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
};

export function StatCard({ helper, icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {helper ? <p className="mt-3 text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
