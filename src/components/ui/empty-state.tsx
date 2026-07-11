import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <Icon className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-4 text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
  );
}
