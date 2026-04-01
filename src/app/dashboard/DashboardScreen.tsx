"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Filter,
  RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";

import { buildDashboardStats } from "@/lib/dashboard";
import type { DashboardReport, DashboardResponse, DashboardStats } from "@/lib/types";

const DashboardMap = dynamic(
  () =>
    import("@/app/_client/DashboardCategoryMap").then(
      (mod) => mod.DashboardCategoryMap,
    ),
  { ssr: false },
);

const SentimentMap = dynamic(
  () => import("@/app/_client/SentimentMap").then((mod) => mod.SentimentMap),
  { ssr: false },
);

type StatusFilter = "All" | "Pending" | "Resolved";
type TimeFilter = "24h" | "7d" | "30d" | "all";
type MapMode = "complaint" | "sentiment";

function getTimeWindowMs(value: TimeFilter) {
  if (value === "24h") return 24 * 60 * 60 * 1000;
  if (value === "7d") return 7 * 24 * 60 * 60 * 1000;
  if (value === "30d") return 30 * 24 * 60 * 60 * 1000;
  return null;
}

function safeText(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function formatStatus(value: string) {
  return value.toLowerCase() === "pending"
    ? "bg-amber-100/80 text-amber-700 border-amber-200"
    : "bg-emerald-100/80 text-emerald-700 border-emerald-200";
}

function calculateHighPriority(reports: DashboardReport[]) {
  return reports.filter(
    (report) =>
      report.aiPriorityLabel?.toLowerCase() === "high" || (report.severity ?? 0) >= 0.75,
  ).length;
}

function calculateResolvedToday(reports: DashboardReport[]) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  return reports.filter(
    (report) =>
      report.status.toLowerCase() === "resolved" &&
      now - new Date(report.createdAt).getTime() <= oneDay,
  ).length;
}

function buildAiInsights(reports: DashboardReport[], stats: DashboardStats) {
  const topCategory = stats.reportsPerCategory[0]?.category ?? "No category data";

  const departmentMap = new Map<string, number>();
  const signalMap = new Map<string, number>();
  let confidenceTotal = 0;
  let confidenceCount = 0;
  let angryCount = 0;

  for (const report of reports) {
    const department = safeText(report.aiDepartment, "Municipal Operations");
    departmentMap.set(department, (departmentMap.get(department) ?? 0) + 1);

    if (report.aiConfidence != null) {
      confidenceTotal += report.aiConfidence;
      confidenceCount += 1;
    }

    if (report.sentimentLabel === "angry") {
      angryCount += 1;
    }

    for (const signal of report.aiKeySignals) {
      signalMap.set(signal, (signalMap.get(signal) ?? 0) + 1);
    }
  }

  const topDepartment =
    [...departmentMap.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "No department tags";
  const topSignal =
    [...signalMap.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    "No signal tags";
  const mostNegativeWard = [...stats.wardSentiment].sort(
    (left, right) => left.averageSentiment - right.averageSentiment,
  )[0];

  return {
    topCategory,
    topDepartment,
    topSignal,
    averageConfidence:
      confidenceCount > 0 ? (confidenceTotal / confidenceCount).toFixed(2) : "N/A",
    angryCount,
    mostNegativeWard: mostNegativeWard
      ? `Ward ${mostNegativeWard.wardNumber} (${mostNegativeWard.averageSentiment.toFixed(2)})`
      : "No ward sentiment data",
  };
}

function sentimentBarColor(score: number) {
  if (score < -0.15) return "bg-red-500";
  if (score > 0.15) return "bg-emerald-500";
  return "bg-blue-500";
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
  className,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: string;
  hint: string;
  className?: string;
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-3xl border border-white/50 bg-white/45 p-4 backdrop-blur-xl sm:p-5 ${
        className ?? ""
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500 sm:text-sm sm:tracking-[0.08em]">
          {label}
        </p>
        <div className={`rounded-2xl p-2 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800 sm:mt-4 sm:text-3xl">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">{hint}</p>
    </article>
  );
}

function AIInsightsPanel({
  reports,
  stats,
}: {
  reports: DashboardReport[];
  stats: DashboardStats;
}) {
  const insights = useMemo(() => buildAiInsights(reports, stats), [reports, stats]);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-blue-200/70 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.9))] p-4 shadow-[0_12px_32px_rgba(59,130,246,0.12)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-500 p-2 text-white">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">AI Insight Radar</h3>
            <p className="text-xs text-slate-500">
              Key patterns from filtered complaints, sentiment, and triage metadata.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Dominant category</p>
            <p className="mt-2 text-base font-bold text-slate-800">{insights.topCategory}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Top department</p>
            <p className="mt-2 text-base font-semibold text-slate-800">{insights.topDepartment}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Angry signals</p>
            <p className="mt-2 text-base font-semibold text-rose-600">{insights.angryCount}</p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Average confidence</p>
            <p className="mt-2 text-base font-semibold text-slate-800">{insights.averageConfidence}</p>
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-blue-100 bg-white/70 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-blue-600">Watchlist</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{insights.mostNegativeWard}</p>
          <p className="mt-1 text-xs text-slate-500">Top signal tag: {insights.topSignal}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/50 bg-white/35 p-4 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-slate-800">Reports by Category</h3>
        <div className="mt-4 space-y-3">
          {stats.reportsPerCategory.length > 0 ? (
            stats.reportsPerCategory.map((item) => (
              <div key={item.category}>
                <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
                  <span>{item.category}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200/60">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${Math.max(
                        8,
                        (item.count / Math.max(stats.totalReports, 1)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No category data available for this filter.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-white/50 bg-white/35 p-4 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-slate-800">Ward Sentiment</h3>
        <div className="mt-4 space-y-3">
          {stats.wardSentiment.length > 0 ? (
            stats.wardSentiment.map((ward) => (
              <div
                key={ward.wardNumber}
                className="flex items-center justify-between rounded-2xl border border-white/50 bg-white/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">Ward {ward.wardNumber}</p>
                  <p className="text-xs text-slate-500">{ward.reportCount} reports</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-24 overflow-hidden rounded-full bg-slate-200/60">
                    <div
                      className={`h-full rounded-full ${sentimentBarColor(ward.averageSentiment)}`}
                      style={{
                        width: `${Math.min(100, Math.abs(ward.averageSentiment) * 100 + 20)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-700">
                    {ward.averageSentiment.toFixed(2)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No ward sentiment data available.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ReportsDataPanel({
  reports,
}: {
  reports: DashboardReport[];
}) {
  return (
    <section className="rounded-3xl border border-white/50 bg-white/40 p-4 shadow-[0_10px_28px_rgba(15,23,42,0.08)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-slate-800 p-2 text-white">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Report Table Card View</h3>
            <p className="text-xs text-slate-500">
              Showing key columns from `Report` table with image, status, and location links.
            </p>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-600">
          {reports.length} complaints
        </span>
      </div>

      <div className="mt-4 max-h-[54rem] space-y-3 overflow-y-auto pr-1">
        {reports.length > 0 ? (
          reports.map((report) => {
            const mapsUrl =
              report.latitude != null && report.longitude != null
                ? `https://www.google.com/maps?q=${report.latitude},${report.longitude}`
                : null;

            return (
              <article
                key={report.id}
                className="rounded-2xl border border-white/60 bg-white/60 p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {report.imageUrl ? (
                      <Image
                        src={report.imageUrl}
                        alt="Report thumbnail"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-slate-700">ID: {report.id}</p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${formatStatus(
                          report.status,
                        )}`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Created: {new Date(report.createdAt).toLocaleString()}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
                      <p>Category: {safeText(report.category, "General")}</p>
                      <p>Ward: {report.wardNumber ?? "Unknown"}</p>
                      <p>Priority: {safeText(report.aiPriorityLabel, "Medium")}</p>
                      <p>Department: {safeText(report.aiDepartment, "Municipal Operations")}</p>
                      <p>Sentiment: {safeText(report.sentimentLabel, "neutral")}</p>
                      <p>Confidence: {report.aiConfidence?.toFixed(2) ?? "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-2 rounded-xl border border-slate-200 bg-white/70 p-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Description</p>
                  <p className="mt-1 text-xs text-slate-700">
                    {safeText(report.description, "No citizen description provided")}
                  </p>
                </div>

                <div className="mt-2 rounded-xl border border-blue-100 bg-blue-50/60 p-2">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-blue-600">AI Summary</p>
                  <p className="mt-1 text-xs text-slate-700">
                    {safeText(report.aiSummary, "No AI summary generated")}
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-600">
                    Coordinates:{" "}
                    {report.latitude != null && report.longitude != null
                      ? `${report.latitude}, ${report.longitude}`
                      : "Not provided"}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/mayor/reports/${report.id}`}
                      className="inline-flex items-center rounded-full bg-blue-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-400"
                    >
                      Open Full Report
                    </Link>
                    {mapsUrl ? (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Maps
                      </a>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <p className="text-sm text-slate-400">No reports found for the current filters.</p>
        )}
      </div>
    </section>
  );
}

export function DashboardScreen() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [mapMode, setMapMode] = useState<MapMode>("complaint");
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      const json = (await response.json()) as DashboardResponse & { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Unable to load reports.");
      }

      setData(json);
      setError(null);
      setLastUpdated(new Date());
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Unable to load reports.";
      setError(message);
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

  const categories = useMemo(
    () => data?.stats.reportsPerCategory.map((item) => item.category) ?? [],
    [data],
  );

  useEffect(() => {
    if (categoryFilter !== "All" && !categories.includes(categoryFilter)) {
      setCategoryFilter("All");
    }
  }, [categories, categoryFilter]);

  const filteredReports = useMemo(() => {
    if (!data) {
      return [];
    }

    const now = Date.now();
    const maxAge = getTimeWindowMs(timeFilter);

    return data.reports.filter((report) => {
      const matchesStatus = statusFilter === "All" || report.status === statusFilter;
      const matchesCategory =
        categoryFilter === "All" || (report.category ?? "Uncategorized") === categoryFilter;

      const withinTime =
        maxAge == null || now - new Date(report.createdAt).getTime() <= maxAge;

      return matchesStatus && matchesCategory && withinTime;
    });
  }, [categoryFilter, data, statusFilter, timeFilter]);

  const filteredStats = useMemo(
    () => buildDashboardStats(filteredReports),
    [filteredReports],
  );
  const resolvedToday = useMemo(
    () => calculateResolvedToday(filteredReports),
    [filteredReports],
  );
  const highPriority = useMemo(
    () => calculateHighPriority(filteredReports),
    [filteredReports],
  );
  const recentReports = useMemo(() => filteredReports.slice(0, 10), [filteredReports]);
  const activeTimeLabel = useMemo(() => {
    if (timeFilter === "24h") return "Last 24 hours";
    if (timeFilter === "7d") return "Last 7 days";
    if (timeFilter === "30d") return "Last 30 days";
    return "All time";
  }, [timeFilter]);

  return (
    <main className="min-h-screen px-3 py-4 pb-8 sm:px-5 lg:px-6 xl:pb-6">
      <div className="mx-auto w-full max-w-none space-y-5">
        <header className="rounded-3xl border border-white/50 bg-white/40 p-5 backdrop-blur-xl lg:p-6">
          {/* Cloudivion Branding */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-slate-200/40 bg-white/30 px-4 py-2.5">
            <a href="https://www.cloudivion.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 opacity-80 transition hover:opacity-100">
              <Image src="https://www.cloudivion.com/images/cloudivion-logo.png" alt="Cloudivion" width={50} height={50} className="h-[50px] w-auto object-contain" />
              <span className="text-xs text-slate-500">Proof of Concept by <span className="font-semibold text-slate-700">cloudivion.com</span></span>
            </a>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-blue-600">
                Hazaribagh Control Room
              </p>
              <h1 className="mt-3 text-3xl font-bold text-slate-800 sm:text-4xl">
                Mayor Dashboard
              </h1>
              
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-2 text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Live updates
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-slate-600">
                <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Updating every 7s
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-slate-600 hover:bg-white/80"
              >
                Citizen App
              </Link>
              <Link
                href="/streetmap"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-4 py-2 text-slate-600 hover:bg-white/80"
              >
                Street Map
              </Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Last refreshed: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Loading..."}
          </p>
        </header>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:col-span-8 xl:grid-cols-4">
            <StatCard
              label="Total Complaints"
              value={filteredStats.totalReports}
              icon={BarChart3}
              tone="bg-blue-100 text-blue-600"
              hint="Reports matching active filters"
            />
            <StatCard
              label="Pending Issues"
              value={filteredStats.pendingReports}
              icon={Clock3}
              tone="bg-amber-100 text-amber-600"
              hint="Needs department action"
            />
            <StatCard
              label="Resolved Today"
              value={resolvedToday}
              icon={CheckCircle2}
              tone="bg-emerald-100 text-emerald-600"
              hint="Closed in the last 24h"
            />
            <StatCard
              label="High Priority"
              value={highPriority}
              icon={AlertTriangle}
              tone="bg-red-100 text-red-600"
              hint="Severity >= 0.75 or AI high"
            />
          </div>

          <section className="rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl sm:p-5 xl:col-span-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operations Snapshot</p>
            <h2 className="mt-2 text-xl font-bold text-slate-800">Control Pulse</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/60 bg-white/55 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Time Window</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{activeTimeLabel}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/55 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Status Filter</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{statusFilter}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/55 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Category</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">{categoryFilter}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/55 p-3">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">Heatmap</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {showHeatmap ? "Visible" : "Hidden"}
                </p>
              </div>
            </div>
          </section>
        </section>

        <section className="rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl lg:p-5">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 outline-none"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={timeFilter}
                onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700 outline-none"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All time</option>
              </select>

            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-8">
            <section className="rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl lg:p-5">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Map View</p>
                  <h2 className="text-2xl font-bold text-slate-800">
                    {mapMode === "complaint" ? "Complaint map" : "Sentiment map"}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMapMode("complaint")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      mapMode === "complaint"
                        ? "bg-blue-500 text-white"
                        : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                    }`}
                  >
                    Complaint
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapMode("sentiment")}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      mapMode === "sentiment"
                        ? "bg-blue-500 text-white"
                        : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white"
                    }`}
                  >
                    Sentiment
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMapFullscreen(true)}
                    className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white"
                  >
                    Full Screen
                  </button>
                </div>
              </div>

              {mapMode === "complaint" ? (
                <>
                  <DashboardMap
                    reports={filteredReports}
                    heatmap={showHeatmap ? filteredStats.heatmap : []}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHeatmap((current) => !current)}
                      className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white"
                    >
                      {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
                    </button>
                    <p className="text-xs text-slate-400">
                      Loaded {filteredReports.length} reports. Nearby reports are slightly offset to
                      keep each marker clickable.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <SentimentMap reports={filteredReports} />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-700">
                        😡 Angry
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-700">
                        😐 Neutral
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-slate-700">
                        🙂 Happy
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Loaded {filteredReports.length} reports based on sentiment label and score.
                    </p>
                  </div>
                </>
              )}
            </section>
          </div>

          <aside className="space-y-5 xl:col-span-4">
            <AIInsightsPanel reports={filteredReports} stats={filteredStats} />
            <ReportsDataPanel reports={recentReports} />
          </aside>
        </section>
      </div>

      {isMapFullscreen ? (
        <div className="fixed inset-0 z-[90] bg-slate-900/70 p-2 sm:p-4">
          <div className="mx-auto flex h-full w-full max-w-[1800px] flex-col overflow-hidden rounded-3xl border border-white/50 bg-white/95 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3 sm:px-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Full Screen Map</p>
                <h2 className="text-lg font-semibold text-slate-800">
                  {mapMode === "complaint" ? "Complaint map" : "Sentiment map"}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMapMode("complaint")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    mapMode === "complaint"
                      ? "bg-blue-500 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Complaint
                </button>
                <button
                  type="button"
                  onClick={() => setMapMode("sentiment")}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    mapMode === "sentiment"
                      ? "bg-blue-500 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Sentiment
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapFullscreen(false)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 p-2 sm:p-3">
              {mapMode === "complaint" ? (
                <DashboardMap
                  reports={filteredReports}
                  heatmap={showHeatmap ? filteredStats.heatmap : []}
                  className="relative h-full overflow-hidden rounded-[1.4rem] border border-white/50 bg-white/40 backdrop-blur-md"
                />
              ) : (
                <SentimentMap
                  reports={filteredReports}
                  className="h-full overflow-hidden rounded-[1.4rem] border border-slate-800 bg-slate-950"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/80 px-4 py-3 sm:px-5">
              {mapMode === "complaint" ? (
                <button
                  type="button"
                  onClick={() => setShowHeatmap((current) => !current)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
                </button>
              ) : (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                    😡 Angry
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                    😐 Neutral
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                    🙂 Happy
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Loaded {filteredReports.length} reports from database
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
