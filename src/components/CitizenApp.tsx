"use client";

import { Camera, CheckCircle2, LocateFixed, MapPin, Send, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

type Step = 1 | 2 | 3;

type SubmissionState = {
  kind: "idle" | "success";
  trackingId?: string;
};

function buildTrackingId() {
  return `JCH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export function CitizenApp() {
  const [step, setStep] = useState<Step>(1);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [issueText, setIssueText] = useState("");
  const [issueType, setIssueType] = useState<string | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [areaText, setAreaText] = useState("");
  const [submission, setSubmission] = useState<SubmissionState>({ kind: "idle" });

  const canAdvanceFromStepOne = Boolean(photoName || issueText.trim());
  const canAdvanceFromStepTwo = Boolean(locationDetected || areaText.trim());
  const canSubmit = canAdvanceFromStepOne && canAdvanceFromStepTwo;

  const helperIssueType = useMemo(() => {
    if (issueType) return issueType;
    if (!photoName) return "AI issue type will appear here";
    return "Analyzing photo...";
  }, [issueType, photoName]);

  function handlePhotoChange(file: File | null) {
    if (!file) {
      setPhotoName(null);
      setIssueType(null);
      return;
    }

    setPhotoName(file.name);
    const mockTypes = ["Garbage pickup", "Drain blockage", "Road damage", "Water leakage"];
    const nextType = mockTypes[file.name.length % mockTypes.length];
    setIssueType(nextType);
  }

  async function handleDetectLocation() {
    setDetectingLocation(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setLocationDetected(true);
    setDetectingLocation(false);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    setSubmission({ kind: "success", trackingId: buildTrackingId() });
    setStep(3);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed833,transparent_32%),linear-gradient(180deg,#eff6ff_0%,#e2e8f0_55%,#dbeafe_100%)] px-3 py-4 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
        <header className="rounded-[28px] bg-white/75 px-4 py-4 shadow-[0_20px_50px_rgba(37,99,235,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blue-600">JanCase</p>
              <h1 className="text-xl font-bold">Citizen App</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Report a civic issue in under 10 seconds.
          </p>
        </header>

        <section className="rounded-[32px] bg-white/80 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">3 Step Report</p>
              <h2 className="mt-1 text-2xl font-bold">Send complaint</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Step {step}/3
            </div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((value) => (
              <div key={value} className={`h-2 rounded-full ${value <= step ? "bg-blue-600" : "bg-slate-200"}`} />
            ))}
          </div>

          {submission.kind === "success" ? (
            <div className="space-y-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-bold text-emerald-900">Complaint submitted</p>
                <p className="mt-2 text-sm text-emerald-800">Tracking ID: <span className="font-bold">{submission.trackingId}</span></p>
              </div>
              <div className="space-y-2 text-sm text-emerald-900">
                <p>✔ You will get tracking ID</p>
                <p>✔ Municipality will review</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setPhotoName(null);
                  setIssueType(null);
                  setIssueText("");
                  setAreaText("");
                  setLocationDetected(false);
                  setSubmission({ kind: "idle" });
                }}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
              >
                Report another issue
              </button>
            </div>
          ) : (
            <>
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full cursor-pointer text-xs text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-white"
                      onChange={(event) => handlePhotoChange(event.target.files?.[0] ?? null)}
                    />
                    <p className="mt-3 text-sm font-medium text-slate-700">{photoName ? `Selected: ${photoName}` : "No photo added yet"}</p>
                    <p className="mt-1 text-xs text-blue-700">{helperIssueType}</p>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <label className="mb-3 block text-sm font-semibold text-slate-700">Describe Issue</label>
                    <textarea
                      value={issueText}
                      onChange={(event) => setIssueText(event.target.value.slice(0, 140))}
                      placeholder="Example: garbage not picked up"
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                    />
                    <p className="mt-2 text-xs text-slate-400">Keep it short. 1 to 2 lines is enough.</p>
                  </div>

                  <button
                    type="button"
                    disabled={!canAdvanceFromStepOne}
                    onClick={() => setStep(2)}
                    className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Continue to Location
                  </button>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <MapPin className="h-4 w-4" />
                      Detect My Location
                    </div>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={detectingLocation}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white disabled:opacity-50"
                    >
                      <LocateFixed className={`h-4 w-4 ${detectingLocation ? "animate-spin" : ""}`} />
                      {detectingLocation ? "Detecting..." : locationDetected ? "Location Attached" : "Detect My Location"}
                    </button>
                    <p className="mt-3 text-xs text-slate-500">Location will be attached automatically.</p>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <label className="mb-3 block text-sm font-semibold text-slate-700">Enter area or landmark</label>
                    <input
                      value={areaText}
                      onChange={(event) => setAreaText(event.target.value)}
                      placeholder="Example: near old bus stand"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!canAdvanceFromStepTwo}
                      onClick={() => setStep(3)}
                      className="rounded-2xl bg-blue-600 px-4 py-4 text-sm font-bold text-white disabled:opacity-40"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">Ready to Submit</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Photo: {photoName ? "Added" : "Not added"}</p>
                      <p>Description: {issueText.trim() ? issueText.trim() : "Not added"}</p>
                      <p>Location: {locationDetected ? "Detected" : areaText.trim() || "Not added"}</p>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p>✔ You will get tracking ID</p>
                    <p className="mt-1">✔ Municipality will review</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!canSubmit}
                      onClick={handleSubmit}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                      Submit Complaint
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
