import Link from "next/link";

import { ReportForm } from "@/components/ReportForm";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background bg-citizen-glow px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-200/80">
              JanCase Hazaribagh
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Citizens report issues. AI structures them. Leadership sees the city pulse.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200">
              This POC accepts text-only, image-only, or mixed civic complaints, routes them through
              AI analysis, and surfaces them to the mayor dashboard as live monitoring signals.
            </p>
          </div>
          <Link
            href="/mayor"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Open mayor dashboard
          </Link>
        </div>

        <ReportForm />
      </div>
    </main>
  );
}
