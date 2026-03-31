"use client";

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";

import type { DashboardReport, HeatmapPoint } from "@/lib/types";

function HeatLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    let layer: L.Layer | null = null;

    async function mountLayer() {
      const leaflet = await import("leaflet");
      await import("leaflet.heat");

      const heatFactory = (leaflet as typeof import("leaflet") & {
        heatLayer?: (data: HeatmapPoint[], options?: { radius?: number; blur?: number; maxZoom?: number }) => L.Layer;
      }).heatLayer;

      if (!heatFactory) {
        return;
      }

      layer = heatFactory(points, { radius: 25, blur: 20, maxZoom: 14 }).addTo(map);
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

export function DashboardMap({
  reports,
  heatmap,
}: {
  reports: DashboardReport[];
  heatmap: HeatmapPoint[];
}) {
  const mappableReports = reports.filter(
    (report) => report.latitude != null && report.longitude != null,
  );

  return (
    <div className="h-[30rem] overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950">
      <MapContainer center={[24.0274, 85.3704]} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={heatmap} />
        {mappableReports.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.latitude as number, report.longitude as number]}
            radius={6}
            pathOptions={{
              color:
                report.sentimentLabel === "angry"
                  ? "#ef4444"
                  : report.sentimentLabel === "happy"
                    ? "#22c55e"
                    : "#3b82f6",
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{report.category ?? "General issue"}</p>
                <p>Status: {report.status}</p>
                <p>Ward: {report.wardNumber ?? "Unknown"}</p>
                <p>{report.description ?? "No description provided."}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
