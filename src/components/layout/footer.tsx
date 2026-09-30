import Link from "next/link";
import { Divider } from "@/components/ui/divider";

export function Footer() {
  return (
    <footer className="bg-vestige-cream py-12 mt-auto">
      <div className="container-xl">
        <Divider className="mb-10" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="font-serif text-[1.2rem] text-vestige-espresso">Vestige</span>
            <p className="t-body-sm text-vestige-stone mt-1">Your style leaves a trace.</p>
          </div>

          <nav className="flex flex-wrap items-center gap-6" aria-label="Footer navigation">
            {[
              { href: "/how-it-works", label: "How it works" },
              { href: "/privacy",      label: "Privacy" },
              { href: "/login",        label: "Sign in" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="t-body-sm text-vestige-stone hover:text-vestige-espresso transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="t-label mt-8 text-vestige-stone/60">
          YouCam API Hackathon 2026 &nbsp;·&nbsp; Vestige
        </p>
      </div>
    </footer>
  );
}
