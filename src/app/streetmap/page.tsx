import type { Metadata } from "next";
import dynamic from "next/dynamic";

const StreetMapView = dynamic(
  () => import("./StreetMapView").then((mod) => mod.StreetMapView),
  { ssr: false },
);

export const metadata: Metadata = {
  title: "Street Map | JanCase Hazaribagh",
  description: "Full-page OpenStreetMap view for street-level navigation context.",
};

export default function StreetMapPage() {
  return <StreetMapView />;
}
