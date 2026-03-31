import type { DashboardStats } from "@/lib/types";
import { formatHeatmapData } from "@/lib/heatmap";

type ReportLike = {
  category: string | null;
  sentimentScore: number | null;
  wardNumber: number | null;
  latitude: number | null;
  longitude: number | null;
  severity: number | null;
  status: string;
};

export function buildDashboardStats(reports: ReportLike[]): DashboardStats {
  const reportsPerCategoryMap = new Map<string, number>();
  const wardMap = new Map<number, { total: number; count: number }>();

  for (const report of reports) {
    const category = report.category ?? "Uncategorized";
    reportsPerCategoryMap.set(category, (reportsPerCategoryMap.get(category) ?? 0) + 1);

    if (report.wardNumber != null && report.sentimentScore != null) {
      const existing = wardMap.get(report.wardNumber) ?? { total: 0, count: 0 };
      wardMap.set(report.wardNumber, {
        total: existing.total + report.sentimentScore,
        count: existing.count + 1,
      });
    }
  }

  return {
    totalReports: reports.length,
    pendingReports: reports.filter((report) => report.status === "Pending").length,
    reportsPerCategory: [...reportsPerCategoryMap.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((left, right) => right.count - left.count),
    wardSentiment: [...wardMap.entries()]
      .map(([wardNumber, value]) => ({
        wardNumber,
        averageSentiment: Number((value.total / value.count).toFixed(2)),
        reportCount: value.count,
      }))
      .sort((left, right) => left.wardNumber - right.wardNumber),
    heatmap: formatHeatmapData(reports),
  };
}
