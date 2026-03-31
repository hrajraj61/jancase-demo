import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, ShieldAlert, Sparkles } from "lucide-react";

import { getReportDetail } from "@/lib/reports";

function sentimentTone(label: string | null) {
  if (label === "angry") return "bg-red-500/15 text-red-200 border-red-500/30";
  if (label === "happy") return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
  return "bg-blue-500/15 text-blue-200 border-blue-500/30";
}

export default async function MayorReportDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const report = await getReportDetail(params.id);

  if (!report) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Complaint Detail</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{report.aiSummary ?? report.category ?? "General Complaint"}</h1>
            <p className="mt-3 text-sm text-slate-300">Created {new Date(report.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/mayor" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-800">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>
            {report.googleMapsUrl ? (
              <a href={report.googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400">
                <ExternalLink className="h-4 w-4" />
                Open in Maps
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/80">
            <div className="border-b border-slate-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Citizen Submission</h2>
            </div>
            {report.imageUrl ? (
              <div className="relative h-80 w-full bg-slate-900">
                <Image src={report.imageUrl} alt="Complaint evidence" fill unoptimized className="object-cover" />
              </div>
            ) : (
              <div className="flex h-80 items-center justify-center bg-slate-900 text-sm text-slate-500">
                No image uploaded for this complaint.
              </div>
            )}
            <div className="space-y-4 px-6 py-5 text-sm text-slate-300">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Complaint text</p>
                <p className="mt-2 text-base leading-7 text-slate-100">
                  {report.description ?? "The citizen submitted this complaint without a text description."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Location</p>
                  <p className="mt-2 text-slate-100">{report.hasLocation ? `${report.latitude}, ${report.longitude}` : "Location not provided"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ward / Status</p>
                  <p className="mt-2 text-slate-100">Ward {report.wardNumber ?? "Unknown"} • {report.status}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-5">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-blue-300" />
                <h2 className="text-lg font-semibold">Gemini Analysis</h2>
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Summary</p>
                  <p className="mt-2 text-base text-slate-100">{report.aiSummary ?? "No summary generated"}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</p>
                    <p className="mt-2 text-base text-slate-100">{report.category ?? "General"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority</p>
                    <p className="mt-2 text-base text-slate-100">{report.aiPriorityLabel ?? "Medium"}</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Severity</p>
                    <p className="mt-2 text-base text-slate-100">{report.severity?.toFixed(2) ?? "0.00"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Confidence</p>
                    <p className="mt-2 text-base text-slate-100">{report.aiConfidence?.toFixed(2) ?? "0.00"}</p>
                  </div>
                </div>
                <div className={`rounded-2xl border p-4 ${sentimentTone(report.sentimentLabel)}`}>
                  <p className="text-xs uppercase tracking-[0.2em] text-current/70">Sentiment</p>
                  <p className="mt-2 text-base capitalize text-current">{report.sentimentLabel ?? "neutral"}</p>
                  <p className="mt-1 text-sm text-current/80">Score {report.sentimentScore?.toFixed(2) ?? "0.00"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Department</p>
                  <p className="mt-2 text-base text-slate-100">{report.aiDepartment ?? "Municipal Operations"}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Action Required</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">{report.aiActionRequired ?? "Inspect and route to the correct team."}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Visual Summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">{report.aiVisualSummary ?? "No visual inference available."}</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Detected Signals</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {report.aiKeySignals.length > 0 ? report.aiKeySignals.map((signal) => (
                      <span key={signal} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-200">{signal}</span>
                    )) : <span className="text-sm text-slate-400">No signal tags generated.</span>}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-5">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="h-5 w-5 text-blue-300" />
                <h2 className="text-lg font-semibold">Location Access</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {report.hasLocation
                  ? "The citizen attached coordinates. Open them directly in Google Maps for field verification or routing."
                  : "No geolocation was attached to this complaint. Use nearby ward and description context instead."}
              </p>
              {report.googleMapsUrl ? (
                <a href={report.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-800">
                  <ExternalLink className="h-4 w-4" />
                  View pinpointed location
                </a>
              ) : null}
            </section>

            <section className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-amber-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                <h2 className="text-lg font-semibold">POC note</h2>
              </div>
              <p className="mt-3 leading-6 text-amber-50/90">
                Ward assignment is currently mock logic based on coordinates, and Gemini analysis is used as an assistive triage signal for the mayor dashboard.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
