"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Divider } from "@/components/ui/divider";
import { GlassCard } from "@/components/ui/glass-card";
import { Spinner } from "@/components/ui/spinner";
import { LogOut, User, Shield, Trash2, ArrowRight } from "lucide-react";

interface SettingRowProps {
  label: string;
  value?: string;
  action?: React.ReactNode;
  description?: string;
}

function SettingRow({ label, value, action, description }: SettingRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-5 border-b border-vestige-sand/70 last:border-0">
      <div>
        <p className="font-sans text-[0.9375rem] text-vestige-ink font-medium">{label}</p>
        {value && <p className="t-body-sm text-vestige-stone mt-0.5">{value}</p>}
        {description && <p className="t-body-sm text-vestige-bark mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export default function AccountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div className="py-section container-lg max-w-2xl">

      {/* ── Header ── */}
      <div className="mb-14">
        <SectionLabel className="mb-6">Account</SectionLabel>
        <h1 className="t-display-lg text-vestige-ink mb-2">
          {session?.user?.name ?? "Your account"}
        </h1>
        <p className="t-body-md text-vestige-stone">{session?.user?.email}</p>
      </div>

      {/* ── Profile section ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <User className="h-3.5 w-3.5 text-vestige-stone" />
          <p className="t-label text-vestige-stone">Profile</p>
        </div>
        <div className="card-elevated px-5">
          <SettingRow
            label="Name"
            value={session?.user?.name ?? "—"}
            action={
              <button className="btn-ghost btn-sm text-vestige-bark">
                Edit
              </button>
            }
          />
          <SettingRow
            label="Email"
            value={session?.user?.email ?? "—"}
            action={
              <button className="btn-ghost btn-sm text-vestige-bark">
                Change
              </button>
            }
          />
          <SettingRow
            label="Password"
            value="Last changed: unknown"
            action={
              <button className="btn-ghost btn-sm text-vestige-bark">
                Update
              </button>
            }
          />
        </div>
      </section>

      {/* ── Style data section ── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="h-3.5 w-3.5 text-vestige-stone" />
          <p className="t-label text-vestige-stone">Style data</p>
        </div>
        <div className="card-elevated px-5">
          <SettingRow
            label="Style Profile"
            description="Your accumulated style DNA — skin traits, preferences, colour palette."
            action={
              <Link href="/style-profile" className="btn-secondary btn-sm gap-1">
                View <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <SettingRow
            label="Style Journey"
            description="Your complete session history and style evolution timeline."
            action={
              <Link href="/journey" className="btn-secondary btn-sm gap-1">
                View <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <SettingRow
            label="Data export"
            description="Download a copy of all your style data in JSON format."
            action={
              <button className="btn-ghost btn-sm text-vestige-bark">
                Export
              </button>
            }
          />
        </div>
      </section>

      <Divider className="mb-10" />

      {/* ── Session section ── */}
      <section className="mb-10">
        <div className="card-elevated px-5">
          <SettingRow
            label="Sign out"
            description="You will be redirected to the landing page."
            action={
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="btn-secondary btn-sm gap-1.5"
              >
                {signingOut ? <Spinner className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />}
                Sign out
              </button>
            }
          />
        </div>
      </section>

      {/* ── Danger zone ── */}
      <section>
        <p className="t-label text-vestige-stone mb-5">Danger zone</p>
        <div className="border border-red-100 rounded-sm px-5">
          <SettingRow
            label="Delete account"
            description="Permanently removes your account, all sessions, feedback, and your style profile. This cannot be undone."
            action={
              !showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn-ghost btn-sm text-red-400 hover:text-red-600 gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-ghost btn-sm text-vestige-stone"
                  >
                    Cancel
                  </button>
                  <button className="btn-sm bg-red-500 text-white rounded-sm px-3 py-1.5 text-xs hover:bg-red-600 transition-colors">
                    Confirm delete
                  </button>
                </div>
              )
            }
          />
        </div>
      </section>
    </div>
  );
}
