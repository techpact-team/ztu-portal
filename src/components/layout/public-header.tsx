import Image from "next/image";
import Link from "next/link";
import { Globe } from "lucide-react";

export function PublicHeader() {
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 py-4 sm:px-6">
        {/* Branding */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/ztu-seal.jpg"
            alt="Zomba Theological University seal"
            width={44}
            height={44}
            className="h-11 w-11 rounded-full object-cover border-2 border-white/20 group-hover:border-white transition"
            priority
          />
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/75">
              Zomba Theological University
            </p>
            <p className="text-base font-bold tracking-wide sm:text-lg">
              Student &amp; Staff Portal
            </p>
          </div>
        </Link>

        {/* Back to website */}
        <a
          href="https://zombatheologicaluniversity.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition"
        >
          <Globe className="h-3.5 w-3.5" />
          Public Website
        </a>
      </div>

      {/* Gold accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-primary/70 via-primary to-primary/70" />
    </header>
  );
}
