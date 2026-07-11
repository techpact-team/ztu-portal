export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white/70 mt-auto">
      {/* Gold accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-primary/70 via-primary to-primary/70" />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>
            &copy; {year}{" "}
            <span className="font-semibold text-white">
              Zomba Theological University
            </span>
            . All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://zombatheologicaluniversity.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition"
            >
              Public Website
            </a>
            <span className="text-white/20">|</span>
            <a
              href="mailto:registrar@ztu.ac.mw"
              className="hover:text-primary transition"
            >
              registrar@ztu.ac.mw
            </a>
            <span className="text-white/20">|</span>
            <a
              href="mailto:it-support@ztu.ac.mw"
              className="hover:text-primary transition"
            >
              IT Support
            </a>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-white/40">
          This portal is for authorised ZTU students and staff only. Unauthorised access is strictly prohibited.
        </p>
      </div>
    </footer>
  );
}
