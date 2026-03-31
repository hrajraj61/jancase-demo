import { NextResponse } from "next/server";
import { z } from "zod";

import { buildDashboardStats } from "@/lib/dashboard";
import { analyzeCivicIssue } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { getSerializedReports } from "@/lib/reports";
import { calculateWard } from "@/lib/ward";

const createReportSchema = z
  .object({
    imageUrl: z.string().url().optional().nullable(),
    description: z.string().trim().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
  })
  .refine(
    (value) =>
      Boolean(value.imageUrl || value.description || value.latitude != null || value.longitude != null),
    "Provide at least a description, image, or location.",
  );

export async function GET() {
  const reports = await getSerializedReports();

  return NextResponse.json({
    reports,
    stats: buildDashboardStats(reports),
  });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = createReportSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid report payload." },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const analysis = await analyzeCivicIssue(payload);
    const wardNumber = calculateWard(payload.latitude, payload.longitude);

    const report = await prisma.report.create({
      data: {
        imageUrl: payload.imageUrl,
        description: payload.description,
        latitude: payload.latitude,
        longitude: payload.longitude,
        wardNumber,
        category: analysis.category,
        severity: analysis.severity,
        sentimentLabel: analysis.sentimentLabel,
        sentimentScore: analysis.sentimentScore,
        aiSummary: analysis.summary,
        aiActionRequired: analysis.actionRequired,
        aiDepartment: analysis.department,
        aiPriorityLabel: analysis.priorityLabel,
        aiVisualSummary: analysis.visualSummary,
        aiConfidence: analysis.confidence,
        aiKeySignals: analysis.keySignals,
      },
    });

    return NextResponse.json({ ...report, createdAt: report.createdAt.toISOString() }, { status: 201 });
  } catch (error) {
    console.error("Failed to create report", error);
    return NextResponse.json({ error: "Unable to create report." }, { status: 500 });
  }
}
