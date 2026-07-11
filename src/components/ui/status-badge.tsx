import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "bg-muted text-navy",
  success: "bg-green-50 text-success",
  warning: "bg-amber-50 text-warning",
  danger: "bg-red-50 text-danger",
  primary: "bg-primary/10 text-primary",
};

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
