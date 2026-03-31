"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationPickerMapProps = {
  value: Coordinates | null;
  onChange: (coords: Coordinates) => void;
};

const PICKER_DEFAULT_ZOOM = 11;

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ coords }: { coords: Coordinates | null }) {
  const map = useMap();

  useEffect(() => {
    if (!coords) {
      return;
    }

    map.setView(
      [coords.latitude, coords.longitude],
      Math.max(map.getZoom(), PICKER_DEFAULT_ZOOM),
    );
  }, [coords, map]);

  return null;
}

function MapClickSelector({
  onSelect,
}: {
  onSelect: (coords: Coordinates) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });

  return null;
}

export function LocationPickerMap({ value, onChange }: LocationPickerMapProps) {
  const defaultCenter: [number, number] = [23.99, 85.36];
  const center: [number, number] = value
    ? [value.latitude, value.longitude]
    : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={PICKER_DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap coords={value} />
      <MapClickSelector onSelect={onChange} />
      {value ? (
        <Marker position={[value.latitude, value.longitude]} icon={markerIcon} />
      ) : null}
    </MapContainer>
  );
}
