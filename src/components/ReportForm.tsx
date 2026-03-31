"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ImagePlus,
  LayoutDashboard,
  LoaderCircle,
  LocateFixed,
  MapPin,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

type SubmissionState = {
  kind: "idle" | "success" | "error";
  message?: string;
};

type Coordinates = {
  latitude: string;
  longitude: string;
};

const initialCoordinates: Coordinates = {
  latitude: "",
  longitude: "",
};

function AppBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
      {label}
    </span>
  );
}

export function ReportForm() {
  const [description, setDescription] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates>(initialCoordinates);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionState>({ kind: "idle" });

  const canSubmit = useMemo(() => {
    return Boolean(selectedFile || description.trim() || coordinates.latitude.trim() || coordinates.longitude.trim());
  }, [coordinates.latitude, coordinates.longitude, description, selectedFile]);

  function resetForm() {
    setDescription("");
    setCoordinates(initialCoordinates);
    setSelectedFile(null);
    setPreviewUrl(null);
  }

  function handleFileChange(file: File | null) {
    setSelectedFile(file);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setResult({ kind: "error", message: "Geolocation is not available in this browser." });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
        setIsLocating(false);
      },
      () => {
        setResult({ kind: "error", message: "Unable to fetch your current location." });
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  }

  async function uploadImage() {
    if (!selectedFile) return null;

    const body = new FormData();
    body.append("file", selectedFile);

    const response = await fetch("/api/upload", { method: "POST", body });
    const data = (await response.json()) as { url?: string; error?: string };

    if (!response.ok || !data.url) {
      throw new Error(data.error ?? "Image upload failed.");
    }

    return data.url;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setResult({ kind: "error", message: "Add a description, image, or location before submitting." });
      return;
    }

    setResult({ kind: "idle" });
    setIsSubmitting(true);

    try {
      setIsUploading(Boolean(selectedFile));
      const imageUrl = await uploadImage();
      setIsUploading(false);

      const payload = {
        imageUrl,
        description: description.trim() || null,
        latitude: coordinates.latitude ? Number(coordinates.latitude) : null,
        longitude: coordinates.longitude ? Number(coordinates.longitude) : null,
      };

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit report.");
      }

      setResult({ kind: "success", message: "Complaint submitted. AI triage has started and the mayor dashboard will update on the next poll." });
      resetForm();
    } catch (error) {
      setResult({ kind: "error", message: error instanceof Error ? error.message : "Something went wrong while submitting." });
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  }

  const busy = isUploading || isSubmitting;

  return (
    <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/40 bg-white/30 shadow-[0_8px_60px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.06),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.4),rgba(255,255,255,0.1))]" />
      <div className="relative border-b border-slate-200/60 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">JanCase</p>
              <h1 className="text-xl font-semibold text-slate-800 sm:text-2xl">Hazaribagh Municipality</h1>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2 rounded-2xl border border-slate-200/60 bg-white/40 p-1">
            <button type="button" className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm">
              <BellRing className="h-4 w-4" />
              Citizen Portal
            </button>
            <Link href="/mayor" className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/60 hover:text-slate-900">
              <LayoutDashboard className="h-4 w-4" />
              Mayor Dashboard
            </Link>
          </nav>
        </div>
      </div>

      {/* Cloudivion Branding */}
      <div className="relative flex items-center justify-center gap-3 border-b border-slate-200/40 bg-white/20 px-4 py-2.5">
        <a href="https://www.cloudivion.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 opacity-80 transition hover:opacity-100">
          <Image src="https://www.cloudivion.com/images/cloudivion-logo.png" alt="Cloudivion" width={50} height={50} className="h-[50px] w-auto object-contain" />
          <span className="text-xs text-slate-500">Proof of Concept by <span className="font-semibold text-slate-700">cloudivion.com</span></span>
        </a>
      </div>

      <div className="relative grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="border-b border-slate-200/40 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:p-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <AppBadge label="Glassmorphism" />
            <AppBadge label="Manual latitude/longitude" />
            <AppBadge label="AI triage" />
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-semibold leading-tight text-slate-800 sm:text-4xl">
              Report a city issue in one screen.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
              Built like an app surface, not a brochure page. Add a photo, describe the issue, and manually enter coordinates if needed.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-[1.6rem] border border-white/50 bg-white/40 p-4 backdrop-blur-xl">
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                <ImagePlus className="h-4 w-4" />
                Photo Evidence
              </label>
              <input
                type="file"
                accept="image/*"
                className="block w-full cursor-pointer text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-800 file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-700"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              />
            </div>

            <div className="rounded-[1.6rem] border border-white/50 bg-white/40 p-4 backdrop-blur-xl">
              <label className="mb-3 block text-sm font-medium text-slate-700">Complaint Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe the issue clearly. Example: garbage piling near market road, drain overflow, power outage..."
                rows={6}
                className="w-full resize-none rounded-[1.2rem] border border-slate-200 bg-white/60 px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div className="rounded-[1.6rem] border border-white/50 bg-white/40 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={isLocating || busy}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LocateFixed className="h-3.5 w-3.5" />
                  {isLocating ? "Locating" : "Use GPS"}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={coordinates.latitude}
                  onChange={(event) => setCoordinates((current) => ({ ...current, latitude: event.target.value }))}
                  placeholder="Latitude"
                  className="rounded-[1.2rem] border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
                />
                <input
                  value={coordinates.longitude}
                  onChange={(event) => setCoordinates((current) => ({ ...current, longitude: event.target.value }))}
                  placeholder="Longitude"
                  className="rounded-[1.2rem] border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>

            {busy ? (
              <div className="rounded-[1.6rem] border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-700">
                <div className="mb-3 flex items-center gap-2">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>{isUploading ? "Uploading image..." : "Analyzing issue with Gemini..."}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                  <div className="h-full w-full animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(59,130,246,0.4),transparent)] bg-[length:200%_100%]" />
                </div>
              </div>
            ) : null}

            {result.kind !== "idle" ? (
              <div className={`flex items-start gap-3 rounded-[1.6rem] p-4 text-sm ${result.kind === "success" ? "border border-emerald-200 bg-emerald-50/80 text-emerald-700" : "border border-red-200 bg-red-50/80 text-red-700"}`}>
                {result.kind === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{result.message}</span>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-4 rounded-[1.6rem] border border-white/50 bg-white/40 p-4">
              <p className="max-w-xs text-xs leading-6 text-slate-500">
                Manual latitude and longitude entry is always available, even if GPS is blocked.
              </p>
              <button
                type="submit"
                disabled={!canSubmit || busy}
                className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                Submit Report
              </button>
            </div>
          </form>
        </section>

        <aside className="flex flex-col gap-4 p-4 sm:p-5 lg:p-6">
          <div className="rounded-[1.8rem] border border-white/50 bg-white/40 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Live Preview</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-800">Citizen submission card</h3>
              </div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${canSubmit ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                {canSubmit ? "Ready" : "Waiting"}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white/70">
              <div className="relative h-64">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Complaint preview" fill unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-50/50 px-8 text-center text-sm text-slate-400">
                    Upload a photo to preview it here. Complaints can still be submitted without an image.
                  </div>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-xs text-slate-600">Photo: {selectedFile ? "Attached" : "Optional"}</span>
                  <span className="rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-xs text-slate-600">Text: {description.trim() ? "Attached" : "Optional"}</span>
                  <span className="rounded-full border border-slate-200 bg-white/60 px-3 py-1 text-xs text-slate-600">Location: {coordinates.latitude && coordinates.longitude ? "Attached" : "Optional"}</span>
                </div>
                <div className="rounded-[1.2rem] border border-slate-200 bg-white/50 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Complaint text</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{description.trim() || "No complaint text added yet."}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Coordinates</p>
                    <p className="mt-2 text-sm text-slate-700">{coordinates.latitude && coordinates.longitude ? `${coordinates.latitude}, ${coordinates.longitude}` : "Not attached"}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-slate-200 bg-white/50 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">AI output</p>
                    <p className="mt-2 text-sm text-slate-700">Summary, action, priority, and signals will be saved in the database.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.6rem] border border-white/50 bg-white/40 p-4 backdrop-blur-xl">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <Search className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-slate-800">AI-rich reports</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">Each complaint now stores summary, action required, department, confidence, and key signals.</p>
            </div>
            <Link href="/mayor" className="rounded-[1.6rem] border border-blue-200 bg-blue-50/60 p-4 backdrop-blur-xl transition hover:bg-blue-50/80">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-slate-800">Open Mayor Dashboard</p>
              <p className="mt-2 text-xs leading-6 text-slate-500">View map clusters, heatmap density, and full complaint details.</p>
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600">
                Go to dashboard
                <ChevronRight className="h-4 w-4" />
              </div>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
