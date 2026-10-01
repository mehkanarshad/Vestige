import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-vestige-accent bg-vestige-ink py-10 text-vestige-cream sm:py-12">
      <div className="container-xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-serif text-2xl font-bold text-vestige-cream">Vestige<span className="text-vestige-accent">.</span></span>
            <p className="t-body-sm mt-2 text-vestige-sand">Your style leaves a trace.</p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-7 gap-y-3" aria-label="Footer navigation">
            {[
              { href: "/how-it-works", label: "How it works" },
              { href: "/privacy",      label: "Privacy" },
              { href: "/login",        label: "Sign in" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="t-body-sm text-vestige-sand transition-colors duration-150 hover:text-vestige-accent"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="t-label mt-8 border-t border-white/15 pt-5 text-vestige-stone">
          YouCam API Hackathon 2026 <span className="px-2 text-vestige-accent">/</span> Vestige
        </p>
      </div>
    </footer>
  );
}
