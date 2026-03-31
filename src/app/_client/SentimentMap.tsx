"use client";

import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import type { DashboardReport } from "@/lib/types";

type SentimentMapProps = {
  reports: DashboardReport[];
};

type DisplayReport = DashboardReport & {
  displayLatitude: number;
  displayLongitude: number;
  nearbyCount: number;
};

function FitToReports({ reports }: { reports: DashboardReport[] }) {
  const map = useMap();

  useEffect(() => {
    const coordinates = reports
      .filter((report) => report.latitude != null && report.longitude != null)
      .map((report) => [report.latitude as number, report.longitude as number] as [number, number]);

    if (coordinates.length === 0) {
      return;
    }

    if (coordinates.length === 1) {
      map.setView(coordinates[0], 15);
      return;
    }

    map.fitBounds(coordinates, { padding: [36, 36] });
  }, [map, reports]);

  return null;
}

function createDisplayReports(reports: DashboardReport[]) {
  const placed: DisplayReport[] = [];
  const threshold = 0.00045;
  const offsetStep = 0.00018;

  for (const report of reports) {
    if (report.latitude == null || report.longitude == null) {
      continue;
    }

    const latitude = report.latitude;
    const longitude = report.longitude;
    const nearby = placed.filter(
      (item) =>
        Math.abs(item.latitude! - latitude) <= threshold &&
        Math.abs(item.longitude! - longitude) <= threshold,
    );

    const angle = nearby.length * 1.35;
    const radius = nearby.length * offsetStep;

    placed.push({
      ...report,
      displayLatitude: latitude + Math.sin(angle) * radius,
      displayLongitude: longitude + Math.cos(angle) * radius,
      nearbyCount: nearby.length + 1,
    });
  }

  return placed;
}

function markerColor(report: DashboardReport) {
  if (report.sentimentLabel === "angry") {
    return "#ef4444";
  }
  if (report.sentimentLabel === "happy") {
    return "#22c55e";
  }
  return "#3b82f6";
}

function markerRadius(report: DashboardReport) {
  const score = Math.abs(report.sentimentScore ?? 0);
  const intensity = Math.max(0.15, Math.min(1, score));
  return 6 + intensity * 8;
}

export function SentimentMap({ reports }: SentimentMapProps) {
  const displayReports = useMemo(() => createDisplayReports(reports), [reports]);

  return (
    <div className="h-[26rem] overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950">
      <MapContainer center={[24.0274, 85.3704]} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToReports reports={reports} />
        {displayReports.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.displayLatitude, report.displayLongitude]}
            radius={markerRadius(report)}
            pathOptions={{
              color: markerColor(report),
              fillColor: markerColor(report),
              fillOpacity: 0.72,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{report.category ?? "General issue"}</p>
                <p className="capitalize">Sentiment: {report.sentimentLabel ?? "neutral"}</p>
                <p>Score: {(report.sentimentScore ?? 0).toFixed(2)}</p>
                <p>{report.aiSummary ?? "No AI summary available"}</p>
                {report.nearbyCount > 1 ? (
                  <p className="text-xs text-slate-500">
                    Nearby complaints are slightly offset for visibility.
                  </p>
                ) : null}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
