"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/session-store";
import { Spinner } from "@/components/ui/spinner";

export default function NewSessionPage() {
  const router = useRouter();
  const { reset, setSessionId } = useSessionStore();

  useEffect(() => {
    reset();

    async function createSession() {
      const res = await fetch("/api/session", { method: "POST" });
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const { id } = await res.json();
      setSessionId(id);
      router.replace(`/session/${id}/photo`);
    }

    createSession();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-6 w-6 text-vestige-bark" />
        <p className="font-sans text-sm text-vestige-stone">
          Preparing your session…
        </p>
      </div>
    </div>
  );
}
