import type { Metadata } from "next";
import nextDynamic from "next/dynamic";

export const dynamic = "force-dynamic";

const StreetMapView = nextDynamic(
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


