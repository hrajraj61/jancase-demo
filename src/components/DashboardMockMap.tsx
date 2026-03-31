"use client";

import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

type Complaint = {
  id: string;
  title: string;
  description: string;
  image: string;
  status: "Pending" | "Resolved";
  category: "Garbage" | "Drain" | "Road" | "Water";
  latitude: number;
  longitude: number;
  ward: string;
  createdAt: string;
  priority: "High" | "Medium" | "Low";
};

type Cluster = {
  id: string;
  latitude: number;
  longitude: number;
  complaints: Complaint[];
};

export function DashboardMockMap({ clusters, showHeatmap, onSelectComplaint }: { clusters: Cluster[]; showHeatmap: boolean; onSelectComplaint: (complaint: Complaint) => void; }) {
  return (
    <div className="h-[34rem] overflow-hidden rounded-3xl border border-slate-800 bg-slate-950">
      <MapContainer center={[24.0274, 85.3704]} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {showHeatmap
          ? clusters.map((cluster) => (
              <CircleMarker
                key={`heat-${cluster.id}`}
                center={[cluster.latitude, cluster.longitude]}
                radius={12 + Math.min(cluster.complaints.length * 4, 18)}
                pathOptions={{ color: "#f97316", fillColor: "#fb923c", fillOpacity: 0.2, weight: 1 }}
              />
            ))
          : null}
        {clusters.map((cluster) => {
          const representative = cluster.complaints[0];
          return (
            <CircleMarker
              key={cluster.id}
              center={[cluster.latitude, cluster.longitude]}
              radius={cluster.complaints.length > 1 ? 16 : 10}
              pathOptions={{
                color: representative.status === "Pending" ? "#ef4444" : "#22c55e",
                fillColor: representative.status === "Pending" ? "#ef4444" : "#22c55e",
                fillOpacity: 0.85,
                weight: 2,
              }}
              eventHandlers={{ click: () => onSelectComplaint(representative) }}
            >
              <Popup>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">{cluster.complaints.length > 1 ? `${cluster.complaints.length} nearby complaints` : representative.title}</p>
                  {cluster.complaints.slice(0, 3).map((complaint) => (
                    <button key={complaint.id} type="button" onClick={() => onSelectComplaint(complaint)} className="block w-full rounded-lg bg-slate-100 px-2 py-1 text-left text-xs text-slate-700">
                      {complaint.category} • {complaint.status} • {new Date(complaint.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </button>
                  ))}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
