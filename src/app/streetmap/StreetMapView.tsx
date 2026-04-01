"use client";

import dynamic from "next/dynamic";

const StreetMapViewClient = dynamic(
  () =>
    import("@/app/_client/StreetMapViewClient").then(
      (mod) => mod.StreetMapViewClient,
    ),
  { ssr: false },
);

export function StreetMapView() {
  return <StreetMapViewClient />;
}
