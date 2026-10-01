"use client";

import { useCallback, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Upload, Camera, ArrowRight, Sun, UserRound, ShieldCheck } from "lucide-react";
import { useSessionStore } from "@/lib/session-store";
import { StepIndicator } from "@/components/session/step-indicator";
import { Spinner } from "@/components/ui/spinner";

export default function PhotoStep() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { setPhoto, setSkinSummary, setSessionId, photoPreview } =
    useSessionStore();

  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(
    photoPreview
  );
  const [localFile, setLocalFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload a JPEG or PNG photo.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Photo must be under 10 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    setLocalFile(file);
    setError("");
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  async function analyzeAndContinue() {
    if (!localFile) return;
    setLoading(true);
    setError("");

    try {
      // Ensure we have a session ID
      let sessionId = id;
      if (!sessionId || sessionId === "new") {
        const res = await fetch("/api/session", { method: "POST" });
        const data = await res.json();
        sessionId = data.id;
        setSessionId(sessionId);
      }

      const fd = new FormData();
      fd.append("photo", localFile);
      fd.append("sessionId", sessionId);

      const res = await fetch("/api/skin-analysis", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Analysis failed");
      }

      const { summary } = await res.json();
      setPhoto(localFile, localPreview!);
      setSkinSummary(summary);

      router.push(`/session/${sessionId}/analysis`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-9 max-w-2xl">
        <StepIndicator current={1} />
        <p className="t-label mt-7 text-vestige-bark">Your styling session begins here</p>
        <h1 className="t-display-lg mt-3 mb-3 text-vestige-ink">
          A clear picture. <span className="text-vestige-bark">A more personal style.</span>
        </h1>
        <p className="t-body-md max-w-xl">
          Vestige uses your photo to analyse your skin and personalise every
          recommendation. Choose a well-lit, face-forward photo to get started.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] lg:items-stretch">
        <section aria-label="Choose a photo">
          <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !localPreview && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!localPreview && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={localPreview ? -1 : 0}
        aria-label={localPreview ? "Uploaded photo preview" : "Choose or drop a photo to upload"}
        className={`relative min-h-[340px] overflow-hidden border-2 border-dashed transition-colors duration-200 sm:min-h-[400px]
          ${dragging ? "border-vestige-accent bg-vestige-parchment" : "border-vestige-sand bg-vestige-white"}
          ${!localPreview ? "cursor-pointer hover:border-vestige-accent hover:bg-vestige-parchment/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-vestige-accent focus-visible:outline-offset-4" : ""}
        `}
      >
        {localPreview ? (
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={localPreview}
              alt="Your uploaded photo"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vestige-ink/30 to-transparent" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLocalPreview(null);
                setLocalFile(null);
              }}
              className="absolute right-4 top-4 bg-vestige-ink px-4 py-2 font-sans text-xs font-medium text-vestige-cream transition-colors hover:bg-vestige-charcoal"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="flex min-h-[340px] flex-col items-center justify-center gap-5 px-6 py-12 text-center text-vestige-stone sm:min-h-[400px]">
            <div className="flex h-16 w-16 items-center justify-center bg-vestige-ink text-vestige-accent">
              <Upload className="h-6 w-6" strokeWidth={1.7} />
            </div>
            <div>
              <p className="font-serif text-2xl font-semibold text-vestige-ink">
                Drop your photo here.
              </p>
              <p className="t-body-sm mt-2 text-vestige-bark">
                Or <span className="font-semibold text-vestige-ink">browse files</span> from your device
              </p>
            </div>
            <p className="t-label-sm text-vestige-stone">
              JPEG, PNG or WebP <span className="px-1 text-vestige-accent">/</span> Up to 10 MB
            </p>
          </div>
        )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />

          {!localPreview && (
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 btn-secondary w-full gap-2 text-sm"
            >
              <Camera className="h-4 w-4" />
              Browse files
            </button>
          )}

          {error && (
            <p role="alert" className="mt-3 font-sans text-xs text-red-600">
              {error}
            </p>
          )}

          {localPreview && (
            <button
              onClick={analyzeAndContinue}
              disabled={loading}
              className="mt-4 btn-accent w-full gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Analysing your skin…
                </>
              ) : (
                <>
                  Analyse &amp; continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </section>

        <aside className="flex flex-col justify-between bg-vestige-parchment p-6 sm:p-8">
          <div>
            <p className="t-label text-vestige-bark">A little photo guidance</p>
            <h2 className="t-display-md mt-4 text-vestige-ink">The best results start with you.</h2>
            <div className="mt-7 space-y-6">
              <div className="flex gap-4">
                <Sun className="mt-0.5 h-5 w-5 shrink-0 text-vestige-accent" strokeWidth={1.7} />
                <p className="t-body-sm text-vestige-umber"><span className="font-semibold text-vestige-ink">Find soft daylight</span><br />Face a window and avoid strong shadows.</p>
              </div>
              <div className="flex gap-4">
                <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-vestige-accent" strokeWidth={1.7} />
                <p className="t-body-sm text-vestige-umber"><span className="font-semibold text-vestige-ink">Look straight ahead</span><br />Keep your face centered and unobstructed.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-vestige-sand pt-5">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-vestige-sage" strokeWidth={1.7} />
              <p className="t-body-sm text-vestige-bark">Your photo is used only for this session&apos;s analysis and try-on.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
