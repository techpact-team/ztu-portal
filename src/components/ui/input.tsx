import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ className, error, id, label, required, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-2 text-sm font-semibold text-navy" htmlFor={inputId}>
      <span>
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      <input
        id={inputId}
        required={required}
        className={cn(
          "h-11 rounded-md border border-border bg-card px-3 text-base font-normal text-foreground transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10",
          error && "border-danger",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm font-medium text-danger">{error}</span> : null}
    </label>
  );
}
