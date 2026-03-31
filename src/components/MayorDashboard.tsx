"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Activity, AlertTriangle, ArrowRight, BarChart3, MapPinned, RefreshCcw } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { DashboardResponse } from "@/lib/types";

const DashboardMap = dynamic(
  () => import("@/components/DashboardMap").then((mod) => mod.DashboardMap),
  { ssr: false },
);

type BurstEmoji = {
  id: string;
  emoji: "😡" | "😊";
  left: number;
  duration: number;
  rotate: number;
};

function StatCard({
  label,
  value,
  icon: Icon,
  note,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  note: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/50 bg-white/40 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500">{label}</span>
        <Icon className="h-5 w-5 text-blue-500" />
      </div>
      <p className="mt-4 text-3xl font-semibold text-slate-800">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p>
    </div>
  );
}

function sentimentColor(value: number) {
  if (value < -0.15) return "bg-red-500/80";
  if (value > 0.15) return "bg-emerald-500/80";
  return "bg-blue-400/80";
}

export function MayorDashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bursts, setBursts] = useState<BurstEmoji[]>([]);
  const seenReportIds = useRef<Set<string>>(new Set());

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      const nextData = (await response.json()) as DashboardResponse & { error?: string };

      if (!response.ok) {
        throw new Error(nextData.error ?? "Unable to load dashboard.");
      }

      setData(nextData);
      setError(null);

      const newReports = nextData.reports.filter((report) => !seenReportIds.current.has(report.id));

      if (seenReportIds.current.size > 0 && newReports.length > 0) {
        const nextBursts: BurstEmoji[] = newReports.flatMap((report) => {
          if (report.sentimentLabel !== "angry" && report.sentimentLabel !== "happy") {
            return [];
          }

          const emoji: BurstEmoji["emoji"] = report.sentimentLabel === "angry" ? "😡" : "😊";
          const count = Math.floor(Math.random() * 11) + 20;

          return Array.from({ length: count }, (_, index) => ({
            id: `${report.id}-${index}-${Date.now()}`,
            emoji,
            left: Math.random() * 100,
            duration: 1.8 + Math.random() * 1.7,
            rotate: Math.random() * 40 - 20,
          }));
        });

        if (nextBursts.length > 0) {
          setBursts((current) => [...current, ...nextBursts]);
          window.setTimeout(() => {
            setBursts((current) => current.filter((burst) => !nextBursts.some((item) => item.id === burst.id)));
          }, 4200);
        }
      }

      seenReportIds.current = new Set(nextData.reports.map((report) => report.id));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboard();
    const interval = window.setInterval(() => {
      void fetchDashboard();
    }, 7000);

    return () => window.clearInterval(interval);
  }, [fetchDashboard]);

  const recentReports = useMemo(() => data?.reports.slice(0, 6) ?? [], [data]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/50 bg-white/30 p-4 backdrop-blur-2xl sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.04),transparent_40%)]" />
      <AnimatePresence>
        {bursts.map((burst) => (
          <motion.span
            key={burst.id}
            initial={{ opacity: 0, y: 20, x: 0, rotate: 0 }}
            animate={{ opacity: [0, 1, 0], y: -220, x: burst.rotate, rotate: burst.rotate }}
            exit={{ opacity: 0 }}
            transition={{ duration: burst.duration, ease: "easeOut" }}
            className="pointer-events-none absolute bottom-8 text-3xl"
            style={{ left: `${burst.left}%` }}
          >
            {burst.emoji}
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Cloudivion Branding */}
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200/40 bg-white/30 px-4 py-2.5">
          <a href="https://www.cloudivion.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 opacity-80 transition hover:opacity-100">
            <Image src="https://www.cloudivion.com/images/cloudivion-logo.png" alt="Cloudivion" width={50} height={50} className="h-[50px] w-auto object-contain" />
            <span className="text-xs text-slate-500">Proof of Concept by <span className="font-semibold text-slate-700">cloudivion.com</span></span>
          </a>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-600">
              Mayor Dashboard
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-800">JanCase Hazaribagh Control Room</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Live heatmap, ward sentiment, complaint detail drill-down, and close-report visibility refreshed every 7 seconds.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-sm text-slate-600">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Polling every 7s
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-4">
          <StatCard label="Total Reports" value={data?.stats.totalReports ?? "--"} icon={BarChart3} note="All complaints received so far." />
          <StatCard label="Pending Issues" value={data?.stats.pendingReports ?? "--"} icon={AlertTriangle} note="Currently unresolved civic issues." />
          <StatCard label="Heatmap Points" value={data?.stats.heatmap.length ?? "--"} icon={MapPinned} note="Heat blobs may merge when complaints are geographically close." />
          <StatCard label="Tracked Wards" value={data?.stats.wardSentiment.length ?? "--"} icon={Activity} note="Wards with at least one sentiment-bearing report." />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-4">
            <DashboardMap reports={data?.reports ?? []} heatmap={data?.stats.heatmap ?? []} />
            <div className="rounded-[1.4rem] border border-white/50 bg-white/40 px-4 py-3 text-xs leading-6 text-slate-500 backdrop-blur-xl">
              Nearby complaints are intentionally offset a little on the map so separate submissions remain clickable even when citizens submit from nearly the same location.
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[1.8rem] border border-white/50 bg-white/40 p-5 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-slate-800">Reports per category</h3>
              <div className="mt-4 space-y-3">
                {(data?.stats.reportsPerCategory ?? []).map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                      <span>{item.category}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400"
                        style={{
                          width: `${Math.max(12, data ? (item.count / Math.max(data.stats.totalReports, 1)) * 100 : 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.8rem] border border-white/50 bg-white/40 p-5 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-slate-800">Ward sentiment</h3>
              <div className="mt-4 space-y-3">
                {(data?.stats.wardSentiment ?? []).map((ward) => (
                  <div key={ward.wardNumber} className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Ward {ward.wardNumber}</p>
                      <p className="text-xs text-slate-400">{ward.reportCount} reports</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-24 overflow-hidden rounded-full bg-slate-200/60">
                        <div className={`h-full rounded-full ${sentimentColor(ward.averageSentiment)}`} style={{ width: `${Math.min(100, Math.abs(ward.averageSentiment) * 100 + 20)}%` }} />
                      </div>
                      <span className="text-sm text-slate-700">{ward.averageSentiment.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="mt-6 rounded-[1.8rem] border border-white/50 bg-white/40 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-800">Recent complaints</h3>
            <p className="text-xs text-slate-400">Open any complaint for image, location, and AI triage details.</p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/mayor/reports/${report.id}`}
                className="group rounded-3xl border border-white/50 bg-white/50 p-4 text-sm text-slate-500 transition hover:border-blue-300 hover:bg-white/70"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700">
                    {report.category ?? "General"}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-slate-700">{report.description ?? "No description submitted."}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                  <span>Status: {report.status}</span>
                  <span>Ward: {report.wardNumber ?? "Unknown"}</span>
                  <span>Sentiment: {report.sentimentLabel ?? "neutral"}</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-blue-500 transition group-hover:text-blue-600">
                  View complaint details
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
