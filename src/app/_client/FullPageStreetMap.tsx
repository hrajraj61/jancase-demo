"use client";

import { MapContainer, ScaleControl, TileLayer, ZoomControl } from "react-leaflet";

const HAZARIBAGH_CENTER: [number, number] = [23.9956, 85.3636];

export function FullPageStreetMap() {
  return (
    <MapContainer
      center={HAZARIBAGH_CENTER}
      zoom={14}
      minZoom={3}
      zoomControl={false}
      scrollWheelZoom
      className="street-map-dark h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      <ZoomControl position="topright" />
      <ScaleControl position="bottomleft" />
    </MapContainer>
  );
}
