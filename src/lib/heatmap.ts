import type { HeatmapPoint } from "@/lib/types";

type ReportLike = {
  latitude: number | null;
  longitude: number | null;
  severity: number | null;
  status: string;
};

export function formatHeatmapData(reports: ReportLike[]): HeatmapPoint[] {
  return reports
    .filter(
      (report) =>
        report.status === "Pending" &&
        report.latitude != null &&
        report.longitude != null,
    )
    .map((report) => [
      report.latitude as number,
      report.longitude as number,
      Number((report.severity ?? 0.5).toFixed(2)),
    ]);
}
