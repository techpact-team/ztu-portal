import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function ContactPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-5xl flex-1 px-4 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-gold">
          Contact
        </p>
        <h1 className="mt-2 text-4xl font-bold text-navy">
          Reach Zomba Theological University
        </h1>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { icon: MapPin, title: "Campus", text: "Zomba, Malawi" },
            { icon: Phone, title: "Phone", text: "+265 999 327 560" },
            {
              icon: MessageCircle,
              title: "WhatsApp",
              text: "+265 999 327 560",
            },
            { icon: Mail, title: "Email", text: "info@ztu.ac.mw" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border bg-card p-6"
            >
              <item.icon className="h-6 w-6 text-primary" />
              <h2 className="mt-4 font-semibold text-navy">{item.title}</h2>
              <p className="mt-1 text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
