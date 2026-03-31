"use client";

import Link from "next/link";
import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";

import type { DashboardReport, HeatmapPoint } from "@/lib/types";

function normalizeCategory(category: string | null): string {
  return category?.trim().toLowerCase() ?? "other";
}

function getCategoryColor(category: string | null): string {
  const normalized = normalizeCategory(category);

  if (normalized === "waste" || normalized === "garbage") {
    return "#ef4444";
  }
  if (normalized === "roads" || normalized === "road") {
    return "#f59e0b";
  }
  if (normalized === "water") {
    return "#06b6d4";
  }
  if (normalized === "electricity" || normalized === "power") {
    return "#eab308";
  }
  if (normalized === "drain" || normalized === "drainage" || normalized === "sewer") {
    return "#3b82f6";
  }
  return "#6b7280";
}

const categoryLegend = [
  { category: "Waste / Garbage", color: "#ef4444" },
  { category: "Roads", color: "#f59e0b" },
  { category: "Water", color: "#06b6d4" },
  { category: "Electricity", color: "#eab308" },
  { category: "Drain", color: "#3b82f6" },
  { category: "Other / General", color: "#6b7280" },
];

function MapLegend() {
  return (
    <div className="absolute bottom-4 right-4 z-[1000] rounded-lg border border-white/50 bg-white/85 p-3 backdrop-blur-md">
      <h4 className="mb-2 text-sm font-semibold text-slate-800">Category Colors</h4>
      <div className="space-y-1">
        {categoryLegend.map(({ category, color }) => (
          <div key={category} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full border border-white/50"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-slate-700">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    let layer: L.Layer | null = null;

    async function mountLayer() {
      const leaflet = await import("leaflet");
      await import("leaflet.heat");

      const heatFactory = (
        leaflet as typeof import("leaflet") & {
          heatLayer?: (
            data: HeatmapPoint[],
            options?: { radius?: number; blur?: number; maxZoom?: number },
          ) => L.Layer;
        }
      ).heatLayer;

      if (!heatFactory) {
        return;
      }

      layer = heatFactory(points, { radius: 28, blur: 24, maxZoom: 14 }).addTo(map);
    }

    mountLayer();

    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map, points]);

  return null;
}

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
  const placed: Array<
    DashboardReport & {
      displayLatitude: number;
      displayLongitude: number;
      nearbyCount: number;
    }
  > = [];
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

export function DashboardCategoryMap({
  reports,
  heatmap,
}: {
  reports: DashboardReport[];
  heatmap: HeatmapPoint[];
}) {
  const displayReports = useMemo(() => createDisplayReports(reports), [reports]);

  return (
    <div className="relative h-[34rem] overflow-hidden rounded-[2rem] border border-white/50 bg-white/40 backdrop-blur-md">
      <MapContainer center={[24.0274, 85.3704]} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={heatmap} />
        <FitToReports reports={reports} />
        {displayReports.map((report) => {
          const markerColor = getCategoryColor(report.category);

          return (
            <CircleMarker
              key={report.id}
              center={[report.displayLatitude, report.displayLongitude]}
              radius={8}
              pathOptions={{
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.92,
                weight: 2,
              }}
            >
              <Popup>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">{report.category ?? "General issue"}</p>
                  <p>{report.description ?? "No description provided."}</p>
                  <p>Status: {report.status}</p>
                  <p>Ward: {report.wardNumber ?? "Unknown"}</p>
                  {report.nearbyCount > 1 ? (
                    <p className="text-xs text-slate-500">
                      Nearby complaints are slightly offset so close reports remain visible.
                    </p>
                  ) : null}
                  <Link href={`/mayor/reports/${report.id}`} className="inline-flex text-blue-600 underline">
                    Open full complaint
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <MapLegend />
    </div>
  );
}
