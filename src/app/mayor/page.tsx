import Link from "next/link";

import { MayorDashboard } from "@/components/MayorDashboard";

export default function MayorPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Civic Operations</p>
            <h1 className="mt-2 text-4xl font-semibold">Mayor Monitoring Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Track issues live, inspect complaint details, and review closely clustered reports without losing visibility.</p>
          </div>
          <Link href="/" className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 transition hover:bg-slate-800">
            Back to citizen form
          </Link>
        </div>

        <MayorDashboard />
      </div>
    </main>
  );
}
