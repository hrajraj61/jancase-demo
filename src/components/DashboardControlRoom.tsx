"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Database,
  Filter,
  RefreshCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardMockMap } from "@/components/DashboardMockMap";

type ComplaintStatus = "Pending" | "Resolved";
type ComplaintCategory = "Garbage" | "Drain" | "Road" | "Water";
type DashboardTab = "insights" | "reports";

type Complaint = {
  id: string;
  title: string;
  description: string;
  image: string;
  status: ComplaintStatus;
  category: ComplaintCategory;
  latitude: number;
  longitude: number;
  ward: string;
  createdAt: string;
  priority: "High" | "Medium" | "Low";
};

const categories: ComplaintCategory[] = ["Garbage", "Drain", "Road", "Water"];
const wards = ["Ward 2", "Ward 5", "Ward 7", "Ward 10", "Ward 15"];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildComplaint(index: number): Complaint {
  const category = randomItem(categories);
  const status = Math.random() > 0.35 ? "Pending" : "Resolved";
  const latitude = 24.0005 + Math.random() * 0.035;
  const longitude = 85.345 + Math.random() * 0.04;
  const priority =
    status === "Pending" && Math.random() > 0.55
      ? "High"
      : Math.random() > 0.5
        ? "Medium"
        : "Low";

  return {
    id: `mock-${index}-${Math.random().toString(36).slice(2, 8)}`,
    title: `${category} issue reported`,
    description: `${category} complaint received from ${randomItem([
      "market road",
      "main chowk",
      "school side",
      "ward lane",
      "bus stand area",
    ])}.`,
    image: `https://picsum.photos/seed/jancase-${index}/600/400`,
    status,
    category,
    latitude,
    longitude,
    ward: randomItem(wards),
    createdAt: new Date(
      Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 36),
    ).toISOString(),
    priority,
  };
}

function clusterComplaints(complaints: Complaint[]) {
  const threshold = 0.006;
  const clusters: Array<{
    id: string;
    latitude: number;
    longitude: number;
    complaints: Complaint[];
  }> = [];

  for (const complaint of complaints) {
    const existing = clusters.find(
      (cluster) =>
        Math.abs(cluster.latitude - complaint.latitude) < threshold &&
        Math.abs(cluster.longitude - complaint.longitude) < threshold,
    );

    if (existing) {
      existing.complaints.push(complaint);
      existing.latitude =
        existing.complaints.reduce((sum, item) => sum + item.latitude, 0) /
        existing.complaints.length;
      existing.longitude =
        existing.complaints.reduce((sum, item) => sum + item.longitude, 0) /
        existing.complaints.length;
    } else {
      clusters.push({
        id: complaint.id,
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        complaints: [complaint],
      });
    }
  }

  return clusters;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <div className={`rounded-2xl p-2 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
        active
          ? "bg-blue-500 text-white shadow-lg shadow-blue-900/25"
          : "bg-slate-950 text-slate-400 hover:bg-slate-900 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function DashboardControlRoom() {
  const [complaints, setComplaints] = useState<Complaint[]>(() =>
    Array.from({ length: 18 }, (_, index) => buildComplaint(index + 1)),
  );
  const [statusFilter, setStatusFilter] = useState<"All" | ComplaintStatus>("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | ComplaintCategory>("All");
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d">("7d");
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("insights");

  useEffect(() => {
    const interval = window.setInterval(() => {
      setComplaints((current) => [buildComplaint(current.length + 1), ...current].slice(0, 30));
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  const filteredComplaints = useMemo(() => {
    const now = Date.now();
    return complaints.filter((complaint) => {
      const timeWindow = timeFilter === "24h" ? 24 : timeFilter === "7d" ? 24 * 7 : 24 * 30;
      const withinTime =
        now - new Date(complaint.createdAt).getTime() <= timeWindow * 60 * 60 * 1000;
      const matchesStatus = statusFilter === "All" || complaint.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || complaint.category === categoryFilter;
      return withinTime && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, complaints, statusFilter, timeFilter]);

  const stats = useMemo(() => {
    const total = filteredComplaints.length;
    const pending = filteredComplaints.filter((complaint) => complaint.status === "Pending").length;
    const resolvedToday = filteredComplaints.filter(
      (complaint) =>
        complaint.status === "Resolved" &&
        Date.now() - new Date(complaint.createdAt).getTime() < 24 * 60 * 60 * 1000,
    ).length;
    const highPriority = filteredComplaints.filter((complaint) => complaint.priority === "High").length;
    return { total, pending, resolvedToday, highPriority };
  }, [filteredComplaints]);

  const categoryBreakdown = useMemo(
    () =>
      categories.map((category) => ({
        category,
        count: filteredComplaints.filter((complaint) => complaint.category === category).length,
      })),
    [filteredComplaints],
  );

  const wardBreakdown = useMemo(
    () =>
      wards
        .map((ward) => ({
          ward,
          count: filteredComplaints.filter((complaint) => complaint.ward === ward).length,
        }))
        .filter((item) => item.count > 0),
    [filteredComplaints],
  );

  const recentComplaints = filteredComplaints.slice(0, 10);
  const clusters = useMemo(() => clusterComplaints(filteredComplaints), [filteredComplaints]);
  const pendingByWard = wardBreakdown.slice(0, 4);
  const aiInsightRows = [
    {
      label: "Dominant Issue Type",
      value: categoryBreakdown.sort((a, b) => b.count - a.count)[0]?.category ?? "None",
    },
    {
      label: "Fastest Growing Queue",
      value: pendingByWard.sort((a, b) => b.count - a.count)[0]?.ward ?? "No pending wards",
    },
    {
      label: "Critical Load",
      value: `${stats.highPriority} high priority complaints`,
    },
    {
      label: "Current Resolution Signal",
      value: stats.resolvedToday > 0 ? `${stats.resolvedToday} resolved today` : "No same-day resolution yet",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-3 py-4 text-white sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-none space-y-5">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 lg:flex-row lg:items-end lg:justify-between lg:p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Hazaribagh Control Room</p>
            <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Mayor Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">Live updates, large map coverage, and a dedicated intelligence panel with desktop and mobile tab navigation.</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-emerald-200">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Live updates
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-slate-300">
              <RefreshCcw className="h-4 w-4" />
              Updating every 5s
            </div>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-slate-300 hover:bg-slate-900">
              Citizen App
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Complaints" value={stats.total} icon={BarChart3} tone="bg-blue-500/15 text-blue-300" />
          <StatCard label="Pending Issues" value={stats.pending} icon={Clock3} tone="bg-amber-500/15 text-amber-300" />
          <StatCard label="Resolved Today" value={stats.resolvedToday} icon={CheckCircle2} tone="bg-emerald-500/15 text-emerald-300" />
          <StatCard label="High Priority Issues" value={stats.highPriority} icon={AlertTriangle} tone="bg-red-500/15 text-red-300" />
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | ComplaintStatus)} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none">
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
              </select>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as "All" | ComplaintCategory)} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none">
                <option value="All">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as "24h" | "7d" | "30d")} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 outline-none">
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <button type="button" onClick={() => setShowHeatmap((current) => !current)} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100">
                {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_430px]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 lg:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Map View</p>
                  <h2 className="text-2xl font-bold text-white">Complaint map</h2>
                </div>
                <p className="text-xs text-slate-500">Nearby complaints are clustered</p>
              </div>
              <DashboardMockMap clusters={clusters} showHeatmap={showHeatmap} onSelectComplaint={setSelectedComplaint} />
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 lg:hidden">
              <div className="mb-4 flex gap-2 overflow-x-auto">
                <TabButton active={activeTab === "insights"} icon={BrainCircuit} label="AI Analysed Insights" onClick={() => setActiveTab("insights")} />
                <TabButton active={activeTab === "reports"} icon={Database} label="Reports Data" onClick={() => setActiveTab("reports")} />
              </div>
              {activeTab === "insights" ? (
                <div className="space-y-4">
                  <section className="rounded-2xl bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">AI Analysed Insights</h3>
                    <div className="mt-4 grid gap-3">
                      {aiInsightRows.map((row) => (
                        <div key={row.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{row.label}</p>
                          <p className="mt-2 text-base font-semibold text-white">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-2xl bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">Reports by Category</h3>
                    <div className="mt-4 space-y-3">
                      {categoryBreakdown.map((item) => (
                        <div key={item.category}>
                          <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                            <span>{item.category}</span>
                            <span>{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(10, (item.count / Math.max(stats.total, 1)) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-4">
                  <section className="rounded-2xl bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">Reports Data</h3>
                    <div className="mt-4 space-y-3">
                      {recentComplaints.map((complaint) => (
                        <button key={complaint.id} type="button" onClick={() => setSelectedComplaint(complaint)} className="flex w-full items-start justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-left text-sm transition hover:bg-slate-800">
                          <div>
                            <p className="font-semibold text-white">{complaint.title}</p>
                            <p className="mt-1 text-slate-400">{complaint.description}</p>
                          </div>
                          <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{complaint.status}</div>
                        </button>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-2xl bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">Selected Complaint</h3>
                    {selectedComplaint ? (
                      <div className="mt-4 grid gap-4">
                        <div className="relative h-52 overflow-hidden rounded-2xl bg-slate-900">
                          <Image src={selectedComplaint.image} alt={selectedComplaint.title} fill unoptimized className="object-cover" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Description</p>
                            <p className="mt-2 text-sm leading-6 text-slate-200">{selectedComplaint.description}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status & Time</p>
                            <p className="mt-2 text-sm text-slate-200">{selectedComplaint.status} • {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-10 text-center text-sm text-slate-500">Select a complaint from the map or feed.</div>
                    )}
                  </section>
                </div>
              )}
            </section>
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex gap-2">
                <TabButton active={activeTab === "insights"} icon={BrainCircuit} label="AI Analysed Insights" onClick={() => setActiveTab("insights")} />
                <TabButton active={activeTab === "reports"} icon={Database} label="Reports Data" onClick={() => setActiveTab("reports")} />
              </div>

              {activeTab === "insights" ? (
                <div className="space-y-4">
                  <section className="rounded-2xl bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">AI Analysed Insights</h3>
                    <div className="mt-4 grid gap-3">
                      {aiInsightRows.map((row) => (
                        <div key={row.label} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{row.label}</p>
                          <p className="mt-2 text-lg font-semibold text-white">{row.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">Reports by Category</h3>
                    <div className="mt-4 space-y-3">
                      {categoryBreakdown.map((item) => (
                        <div key={item.category}>
                          <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                            <span>{item.category}</span>
                            <span>{item.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(10, (item.count / Math.max(stats.total, 1)) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">Ward-wise Distribution</h3>
                    <div className="mt-4 space-y-3">
                      {wardBreakdown.map((item) => (
                        <div key={item.ward} className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-300">
                          <span>{item.ward}</span>
                          <span className="font-semibold text-white">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="space-y-4">
                  <section className="rounded-2xl bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">Reports Data</h3>
                    <div className="mt-4 space-y-3 max-h-[26rem] overflow-y-auto pr-1">
                      {recentComplaints.map((complaint) => (
                        <button key={complaint.id} type="button" onClick={() => setSelectedComplaint(complaint)} className="flex w-full items-start justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-left text-sm transition hover:bg-slate-800">
                          <div>
                            <p className="font-semibold text-white">{complaint.title}</p>
                            <p className="mt-1 text-slate-400">{complaint.description}</p>
                          </div>
                          <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{complaint.status}</div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl bg-slate-950 p-4">
                    <h3 className="text-lg font-semibold text-white">Selected Complaint</h3>
                    {selectedComplaint ? (
                      <div className="mt-4 grid gap-4">
                        <div className="relative h-56 overflow-hidden rounded-2xl bg-slate-900">
                          <Image src={selectedComplaint.image} alt={selectedComplaint.title} fill unoptimized className="object-cover" />
                        </div>
                        <div className="grid gap-3">
                          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Description</p>
                            <p className="mt-2 text-sm leading-6 text-slate-200">{selectedComplaint.description}</p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Status & Time</p>
                              <p className="mt-2 text-sm text-slate-200">{selectedComplaint.status} • {new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Category & Priority</p>
                              <p className="mt-2 text-sm text-slate-200">{selectedComplaint.category} • {selectedComplaint.priority}</p>
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ward & Coordinates</p>
                            <p className="mt-2 text-sm text-slate-200">{selectedComplaint.ward} • {selectedComplaint.latitude.toFixed(4)}, {selectedComplaint.longitude.toFixed(4)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-10 text-center text-sm text-slate-500">Select a complaint from the map or reports list.</div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </aside>
        </section>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 p-3 backdrop-blur xl:hidden">
          <div className="mx-auto flex max-w-md gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2">
            <button type="button" onClick={() => setActiveTab("insights")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === "insights" ? "bg-blue-500 text-white" : "text-slate-400"}`}>
              AI Analysed Insights
            </button>
            <button type="button" onClick={() => setActiveTab("reports")} className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${activeTab === "reports" ? "bg-blue-500 text-white" : "text-slate-400"}`}>
              Reports Data
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
