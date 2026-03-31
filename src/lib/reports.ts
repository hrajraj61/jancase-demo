import { prisma } from "@/lib/prisma";
import type { DashboardReport, ReportDetail } from "@/lib/types";

function serializeReport(report: {
  id: string;
  createdAt: Date;
  imageUrl: string | null;
  description: string | null;
  category: string | null;
  severity: number | null;
  latitude: number | null;
  longitude: number | null;
  wardNumber: number | null;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  aiSummary: string | null;
  aiActionRequired: string | null;
  aiDepartment: string | null;
  aiPriorityLabel: string | null;
  aiVisualSummary: string | null;
  aiConfidence: number | null;
  aiKeySignals: string[];
  status: string;
}): DashboardReport {
  return {
    ...report,
    createdAt: report.createdAt.toISOString(),
  };
}

export async function getSerializedReports() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
  });

  return reports.map(serializeReport);
}

export async function getReportDetail(id: string): Promise<ReportDetail | null> {
  const report = await prisma.report.findUnique({ where: { id } });

  if (!report) {
    return null;
  }

  const serialized = serializeReport(report);
  const hasLocation = serialized.latitude != null && serialized.longitude != null;

  return {
    ...serialized,
    hasImage: Boolean(serialized.imageUrl),
    hasLocation,
    googleMapsUrl: hasLocation
      ? `https://www.google.com/maps?q=${serialized.latitude},${serialized.longitude}`
      : null,
  };
}
