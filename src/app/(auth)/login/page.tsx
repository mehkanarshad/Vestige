"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/home");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-vestige-cream">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-3xl text-vestige-espresso">
            Vestige
          </Link>
          <p className="caption mt-2">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block font-sans text-xs text-vestige-bark mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="vestige-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-sans text-xs text-vestige-bark mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="vestige-input pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vestige-stone hover:text-vestige-bark transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="font-sans text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2 gap-2"
          >
            {loading ? "Signing in…" : "Sign in"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <p className="text-center font-sans text-xs text-vestige-stone mt-6">
          No account?{" "}
          <Link
            href="/signup"
            className="text-vestige-bark hover:text-vestige-espresso underline underline-offset-2"
          >
            Create one
          </Link>
        </p>

        {/* Demo hint */}
        <div className="mt-8 p-3 bg-vestige-sand/50 rounded-sm border border-vestige-sand text-center">
          <p className="font-sans text-xs text-vestige-stone">
            Demo account
          </p>
          <p className="font-sans text-xs text-vestige-bark mt-0.5">
            demo@vestige.style · password: vestige2026
          </p>
        </div>
      </div>
    </div>
  );
}
