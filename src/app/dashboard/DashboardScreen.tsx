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
type DashboardTab = "insights" | "reports";

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
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-white/50 bg-white/40 p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={`rounded-2xl p-2 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  label,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
          : "bg-white/50 text-slate-500 hover:bg-white/70 hover:text-slate-800"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
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
      <section className="rounded-2xl bg-white/30 p-4 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-slate-800">AI Analysed Insights</h3>
        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dominant category</p>
            <p className="mt-2 text-xl font-bold text-slate-800">{insights.topCategory}</p>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Most negative ward</p>
            <p className="mt-2 text-lg font-semibold text-slate-800">{insights.mostNegativeWard}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top department</p>
              <p className="mt-2 text-base font-semibold text-slate-800">
                {insights.topDepartment}
              </p>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Average confidence</p>
              <p className="mt-2 text-base font-semibold text-slate-800">
                {insights.averageConfidence}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Angry signals</p>
              <p className="mt-2 text-base font-semibold text-red-600">{insights.angryCount}</p>
            </div>
            <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top signal tag</p>
              <p className="mt-2 text-base font-semibold text-slate-800">{insights.topSignal}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white/30 p-4 backdrop-blur-sm">
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

      <section className="rounded-2xl bg-white/30 p-4 backdrop-blur-sm">
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
  selectedReport,
  onSelect,
}: {
  reports: DashboardReport[];
  selectedReport: DashboardReport | null;
  onSelect: (report: DashboardReport) => void;
}) {
  const mapsUrl =
    selectedReport?.latitude != null && selectedReport.longitude != null
      ? `https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`
      : null;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-white/30 p-4 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-slate-800">Reports Data</h3>
        <div className="mt-4 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
          {reports.length > 0 ? (
            reports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => onSelect(report)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selectedReport?.id === report.id
                    ? "border-blue-300 bg-blue-50/70"
                    : "border-white/50 bg-white/50 hover:border-slate-300"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${formatStatus(report.status)}`}
                  >
                    {report.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-base font-bold text-slate-800">
                  {safeText(report.aiSummary, "No AI summary generated")}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {safeText(report.description, "No citizen description provided")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>Category: {safeText(report.category, "General")}</span>
                  <span>Priority: {safeText(report.aiPriorityLabel, "Medium")}</span>
                  <span>Department: {safeText(report.aiDepartment, "Municipal Operations")}</span>
                </div>
              </button>
            ))
          ) : (
            <p className="text-sm text-slate-400">No reports found for the current filters.</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white/30 p-4 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-slate-800">Selected Report</h3>
        {selectedReport ? (
          <div className="mt-4 space-y-4">
            <div className="relative h-56 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {selectedReport.imageUrl ? (
                <Image
                  src={selectedReport.imageUrl}
                  alt="Complaint evidence"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                  No image uploaded for this complaint.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-500">AI Summary</p>
              <p className="mt-2 text-lg font-bold text-slate-800">
                {safeText(selectedReport.aiSummary, "No AI summary generated")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Category</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {safeText(selectedReport.category, "General")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {safeText(selectedReport.aiPriorityLabel, "Medium")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Department</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {safeText(selectedReport.aiDepartment, "Municipal Operations")}
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Confidence</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  {selectedReport.aiConfidence?.toFixed(2) ?? "N/A"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Action Required</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {safeText(selectedReport.aiActionRequired, "No action recommendation generated")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Visual Summary</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {safeText(selectedReport.aiVisualSummary, "No visual summary generated")}
              </p>
            </div>

            <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Detected Signals</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedReport.aiKeySignals.length > 0 ? (
                  selectedReport.aiKeySignals.map((signal) => (
                    <span
                      key={signal}
                      className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs text-slate-600"
                    >
                      {signal}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-400">No AI signal tags</span>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Coordinates</p>
                <p className="mt-2 text-sm text-slate-700">
                  {selectedReport.latitude != null && selectedReport.longitude != null
                    ? `${selectedReport.latitude}, ${selectedReport.longitude}`
                    : "Location not provided"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ward / Status</p>
                <p className="mt-2 text-sm text-slate-700">
                  Ward {selectedReport.wardNumber ?? "Unknown"} / {selectedReport.status}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href={`/mayor/reports/${selectedReport.id}`}
                className="inline-flex items-center justify-center rounded-full bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                Open Full Report Page
              </Link>
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Maps
                </a>
              ) : (
                <div className="flex items-center justify-center rounded-full border border-slate-200 bg-white/50 px-4 py-2.5 text-sm text-slate-400">
                  No map coordinates
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-white/40 px-4 py-10 text-center text-sm text-slate-400">
            Select a report from the list or map.
          </div>
        )}
      </section>
    </div>
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
  const [activeTab, setActiveTab] = useState<DashboardTab>("insights");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

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

  useEffect(() => {
    if (filteredReports.length === 0) {
      setSelectedReportId(null);
      return;
    }

    const exists = selectedReportId
      ? filteredReports.some((report) => report.id === selectedReportId)
      : false;

    if (!exists) {
      setSelectedReportId(filteredReports[0].id);
    }
  }, [filteredReports, selectedReportId]);

  const selectedReport = useMemo(
    () => filteredReports.find((report) => report.id === selectedReportId) ?? null,
    [filteredReports, selectedReportId],
  );

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

  return (
    <main className="min-h-screen px-3 py-4 pb-24 sm:px-5 lg:px-6 xl:pb-6">
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
              <p className="text-sm uppercase tracking-[0.35em] text-purple-600">
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Complaints"
            value={filteredStats.totalReports}
            icon={BarChart3}
            tone="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="Pending Issues"
            value={filteredStats.pendingReports}
            icon={Clock3}
            tone="bg-amber-100 text-amber-600"
          />
          <StatCard
            label="Resolved Today"
            value={resolvedToday}
            icon={CheckCircle2}
            tone="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            label="High Priority Issues"
            value={highPriority}
            icon={AlertTriangle}
            tone="bg-red-100 text-red-600"
          />
        </section>

        <section className="rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
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

              <button
                type="button"
                onClick={() => setShowHeatmap((current) => !current)}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm text-slate-700"
              >
                {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_430px]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl lg:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-500">Map View</p>
                  <h2 className="text-2xl font-bold text-slate-800">Complaint map</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Loaded {filteredReports.length} reports from database
                </p>
              </div>
              <DashboardMap
                reports={filteredReports}
                heatmap={showHeatmap ? filteredStats.heatmap : []}
              />
              <p className="mt-3 text-xs text-slate-400">
                If two complaints have very close coordinates, heatmap blobs can merge visually.
                Markers are slightly offset to keep each report clickable.
              </p>
            </section>

            <section className="rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl lg:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-slate-500">Sentiment View</p>
                  <h2 className="text-2xl font-bold text-slate-800">Sentiment map</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Based on sentimentLabel and sentimentScore
                </p>
              </div>
              <SentimentMap reports={filteredReports} />
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
                  Angry
                </span>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                  Neutral
                </span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                  Happy
                </span>
              </div>
            </section>

            <section className="rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl xl:hidden">
              <div className="mb-4 flex gap-2 overflow-x-auto">
                <TabButton
                  active={activeTab === "insights"}
                  icon={BrainCircuit}
                  label="AI Analysed Insights"
                  onClick={() => setActiveTab("insights")}
                />
                <TabButton
                  active={activeTab === "reports"}
                  icon={Database}
                  label="Reports Data"
                  onClick={() => setActiveTab("reports")}
                />
              </div>
              {activeTab === "insights" ? (
                <AIInsightsPanel reports={filteredReports} stats={filteredStats} />
              ) : (
                <ReportsDataPanel
                  reports={recentReports}
                  selectedReport={selectedReport}
                  onSelect={(report) => setSelectedReportId(report.id)}
                />
              )}
            </section>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-4 rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl">
              <div className="flex gap-2">
                <TabButton
                  active={activeTab === "insights"}
                  icon={BrainCircuit}
                  label="AI Analysed Insights"
                  onClick={() => setActiveTab("insights")}
                />
                <TabButton
                  active={activeTab === "reports"}
                  icon={Database}
                  label="Reports Data"
                  onClick={() => setActiveTab("reports")}
                />
              </div>
              {activeTab === "insights" ? (
                <AIInsightsPanel reports={filteredReports} stats={filteredStats} />
              ) : (
                <ReportsDataPanel
                  reports={recentReports}
                  selectedReport={selectedReport}
                  onSelect={(report) => setSelectedReportId(report.id)}
                />
              )}
            </div>
          </aside>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/60 bg-white/80 p-3 backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-md gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2">
          <button
            type="button"
            onClick={() => setActiveTab("insights")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${
              activeTab === "insights" ? "bg-blue-500 text-white" : "text-slate-500"
            }`}
          >
            AI Insights
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${
              activeTab === "reports" ? "bg-blue-500 text-white" : "text-slate-500"
            }`}
          >
            Reports Data
          </button>
        </div>
      </div>
    </main>
  );
}
