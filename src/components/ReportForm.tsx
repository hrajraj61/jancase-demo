"use client";

import Image from "next/image";
import { AlertCircle, CheckCircle2, ImagePlus, LoaderCircle, LocateFixed, Send } from "lucide-react";
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
    return Boolean(
      selectedFile ||
        description.trim() ||
        coordinates.latitude.trim() ||
        coordinates.longitude.trim(),
    );
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
    if (!selectedFile) {
      return null;
    }

    const body = new FormData();
    body.append("file", selectedFile);

    const response = await fetch("/api/upload", {
      method: "POST",
      body,
    });

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit report.");
      }

      setResult({
        kind: "success",
        message: "Issue submitted successfully. The mayor dashboard will pick it up on the next poll.",
      });
      resetForm();
    } catch (error) {
      setResult({
        kind: "error",
        message: error instanceof Error ? error.message : "Something went wrong while submitting.",
      });
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  }

  const busy = isUploading || isSubmitting;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/25 bg-white/10 p-6 shadow-glass backdrop-blur-xl sm:p-8"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-100/80">
            Citizen Reporting
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Report an issue in seconds</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200">
            Share a photo, describe the issue, or drop your location. Any one of them is enough to
            create a valid report.
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <label className="block rounded-3xl border border-white/20 bg-slate-950/20 p-4">
            <span className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-100">
              <ImagePlus className="h-4 w-4" />
              Upload image
            </span>
            <input
              type="file"
              accept="image/*"
              className="block w-full cursor-pointer text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-white/90 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-900 hover:file:bg-white"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
          </label>

          <label className="block rounded-3xl border border-white/20 bg-slate-950/20 p-4">
            <span className="mb-3 block text-sm font-medium text-slate-100">Describe the issue</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Example: Garbage has not been collected near the market road since yesterday."
              rows={6}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none ring-0 placeholder:text-slate-300/70 focus:border-blue-300"
            />
          </label>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-white/20 bg-slate-950/20 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-100">Location</span>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={isLocating || busy}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LocateFixed className="h-4 w-4" />
                {isLocating ? "Locating..." : "Use my location"}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={coordinates.latitude}
                onChange={(event) =>
                  setCoordinates((current) => ({ ...current, latitude: event.target.value }))
                }
                placeholder="Latitude"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-300/70 focus:border-blue-300 focus:outline-none"
              />
              <input
                value={coordinates.longitude}
                onChange={(event) =>
                  setCoordinates((current) => ({ ...current, longitude: event.target.value }))
                }
                placeholder="Longitude"
                className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-300/70 focus:border-blue-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-dashed border-white/20 bg-slate-950/20 p-4">
            <span className="text-sm font-medium text-slate-100">Preview</span>
            <div className="mt-3 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  width={1200}
                  height={800}
                  unoptimized
                  className="h-56 w-full object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center text-sm text-slate-300/70">
                  Upload an image to preview it here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {busy ? (
          <div className="rounded-2xl border border-blue-300/30 bg-blue-400/10 p-4 text-sm text-blue-50">
            <div className="mb-3 flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>{isUploading ? "Uploading image..." : "Analyzing issue..."}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-full animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)] bg-[length:200%_100%]" />
            </div>
          </div>
        ) : null}

        {result.kind !== "idle" ? (
          <div
            className={`flex items-start gap-3 rounded-2xl p-4 text-sm ${
              result.kind === "success"
                ? "border border-emerald-300/30 bg-emerald-500/10 text-emerald-50"
                : "border border-red-300/30 bg-red-500/10 text-red-50"
            }`}
          >
            {result.kind === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{result.message}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          Submit report
        </button>
      </div>
    </form>
  );
}
