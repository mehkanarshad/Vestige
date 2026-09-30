"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, User, LogOut } from "lucide-react";

const PUBLIC_NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/privacy",      label: "Privacy" },
];

const APP_NAV = [
  { href: "/home",            label: "Home" },
  { href: "/session/new",     label: "Session" },
  { href: "/discover",        label: "Discover" },
  { href: "/style-profile",   label: "My Style" },
  { href: "/journey",         label: "Journey" },
];

export function Nav() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const authed = status === "authenticated";
  const links  = authed ? APP_NAV : PUBLIC_NAV;

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          scrolled || open
            ? "bg-vestige-cream/96 backdrop-blur-md border-b border-vestige-sand"
            : "bg-transparent border-b border-transparent"
        )}
        style={{ height: 56 }}
      >
        <div className="container-xl h-full flex items-center justify-between gap-8">

          {/* Wordmark */}
          <Link
            href={authed ? "/home" : "/"}
            className="flex-shrink-0"
            aria-label="Vestige"
          >
            <span
              className="font-serif font-bold text-vestige-ink tracking-tight"
              style={{ fontSize: "1.3125rem", letterSpacing: "-0.01em" }}
            >
              Vestige
            </span>
          </Link>

          {/* Desktop nav — centred */}
          <nav
            className="hidden md:flex items-center gap-8 flex-1 justify-center"
            aria-label="Primary"
          >
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "nav-link transition-colors duration-150",
                  isActive(href) ? "active" : ""
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            {authed ? (
              <>
                {/* Begin Styling — the one gold CTA in the nav */}
                <Link
                  href="/session/new"
                  className="btn-accent btn-sm"
                  style={{ letterSpacing: "0.02em" }}
                >
                  Begin Styling
                </Link>
                {/* Account avatar */}
                <Link
                  href="/account"
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center transition-colors duration-150",
                    isActive("/account")
                      ? "bg-vestige-ink text-vestige-cream"
                      : "bg-vestige-sand text-vestige-bark hover:bg-vestige-ink hover:text-vestige-cream"
                  )}
                  aria-label="Account"
                >
                  <User className="h-3 w-3" strokeWidth={2} />
                </Link>
              </>
            ) : (
              <>
                <Link href="/login"  className="nav-link">Sign in</Link>
                <Link href="/signup" className="btn-primary btn-sm">Get started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(v => !v)}
            className="md:hidden h-9 w-9 flex items-center justify-center text-vestige-bark hover:text-vestige-ink transition-colors"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        ref={menuRef}
        className={cn(
          "fixed inset-0 z-40 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        {/* Scrim */}
        <div
          className={cn(
            "absolute inset-0 bg-vestige-ink/25 backdrop-blur-sm transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />

        {/* Panel — slides from right */}
        <div
          className={cn(
            "absolute top-0 right-0 bottom-0 w-72 bg-vestige-cream flex flex-col transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full"
          )}
          style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-6 border-b border-vestige-sand"
            style={{ height: 56 }}
          >
            <span className="font-serif font-bold text-vestige-ink" style={{ fontSize: "1.2rem" }}>
              Vestige
            </span>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center text-vestige-bark"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Links */}
          <nav className="flex-1 overflow-y-auto px-6 pt-4 pb-4" aria-label="Mobile">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center py-4 border-b border-vestige-sand/60 transition-colors duration-150",
                  "font-sans text-[0.9375rem]",
                  isActive(href)
                    ? "text-vestige-ink font-medium"
                    : "text-vestige-bark hover:text-vestige-ink"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Panel footer */}
          <div className="px-6 pb-8 pt-4 border-t border-vestige-sand space-y-2.5">
            {authed ? (
              <>
                <Link href="/session/new" className="btn-accent w-full">
                  Begin Styling
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-ghost w-full gap-2 text-vestige-stone"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/signup" className="btn-primary w-full">Get started</Link>
                <Link href="/login"  className="btn-outline w-full">Sign in</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
