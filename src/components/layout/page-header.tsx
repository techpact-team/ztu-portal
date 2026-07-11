type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({
  action,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary before:h-1 before:w-7 before:rounded-full before:bg-gold">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-bold tracking-[-0.035em] text-navy sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
