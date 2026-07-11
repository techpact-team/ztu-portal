import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-danger">
        403 Forbidden
      </p>
      <h1 className="mt-2 text-3xl font-bold text-navy">Access restricted</h1>
      <p className="mt-4 leading-7 text-muted-foreground">
        Your account is authenticated, but it does not have permission to open
        this area.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Return home
      </Link>
    </main>
  );
}
