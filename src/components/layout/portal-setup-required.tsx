import Link from "next/link";

type PortalSetupRequiredProps = {
  portal: "student" | "staff";
};

export function PortalSetupRequired({ portal }: PortalSetupRequiredProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-warning">
        Supabase configuration required
      </p>
      <h1 className="mt-2 text-3xl font-bold text-navy">
        The {portal} portal is ready for connection
      </h1>
      <p className="mt-4 leading-7 text-muted-foreground">
        Add the Supabase environment variables from `.env.example`, apply the
        migrations in `supabase/migrations`, and restart the Next.js server to
        enable authenticated portal access.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Return to public website
      </Link>
    </main>
  );
}
