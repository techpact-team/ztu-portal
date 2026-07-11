"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton({ loginHref }: { loginHref: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-[15px] font-extrabold text-white/95 hover:bg-white/10 hover:text-white"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.replace(loginHref);
          router.refresh();
        });
      }}
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
