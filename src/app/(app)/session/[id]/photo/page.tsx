"use client";

import { useCallback, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Upload, Camera, ArrowRight } from "lucide-react";
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
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <StepIndicator current={1} />
        <h1 className="display-md text-vestige-ink mt-6 mb-2">
          Upload your photo
        </h1>
        <p className="body-lg text-sm">
          Vestige uses your photo to analyse your skin and personalise every
          recommendation. A well-lit, face-forward photo works best.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !localPreview && inputRef.current?.click()}
        className={`relative rounded-lg border-2 border-dashed transition-colors duration-200 overflow-hidden
          ${dragging ? "border-vestige-bark bg-vestige-sand/40" : "border-vestige-sand bg-white/40"}
          ${!localPreview ? "cursor-pointer hover:border-vestige-bark hover:bg-vestige-sand/20" : ""}
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
              className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-vestige-ink text-xs px-3 py-1.5 rounded-sm hover:bg-white transition-colors"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center gap-4 text-vestige-stone">
            <div className="h-12 w-12 rounded-full bg-vestige-sand flex items-center justify-center">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-center">
              <p className="font-sans text-sm text-vestige-bark">
                Drop your photo here
              </p>
              <p className="font-sans text-xs text-vestige-stone mt-1">
                or click to browse
              </p>
            </div>
            <p className="font-sans text-xs text-vestige-stone/60">
              JPEG or PNG · up to 10 MB
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

      {/* Camera button hint */}
      {!localPreview && (
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-3 w-full btn-secondary text-sm gap-2"
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

      {/* Continue */}
      {localPreview && (
        <button
          onClick={analyzeAndContinue}
          disabled={loading}
          className="mt-6 btn-primary w-full gap-2 text-sm"
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

      <p className="mt-4 font-sans text-xs text-vestige-stone text-center">
        Your photo is used only for this session&apos;s analysis and try-on.
      </p>
    </div>
  );
}
