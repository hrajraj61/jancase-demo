"use client";

import Link from "next/link";
import { LocateFixed, MapPinned, Search, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type MapPoint = [number, number];

type NominatimSearchResult = {
  lat: string;
  lon: string;
  display_name: string;
};

const DEFAULT_CENTER: MapPoint = [23.9903, 85.3697];
const DEFAULT_ZOOM = 13;
const FOCUSED_ZOOM = 17;

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function RecenterMap({ center, zoom }: { center: MapPoint; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);

  return null;
}

function ClickToPin({ onPin }: { onPin: (position: MapPoint) => void }) {
  useMapEvents({
    click(event) {
      onPin([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export function StreetMapCanvas() {
  const [center, setCenter] = useState<MapPoint>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [marker, setMarker] = useState<MapPoint | null>(null);
  const [locationName, setLocationName] = useState("Hazaribagh");
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markerText = useMemo(() => {
    if (!marker) {
      return "Tap map, search place, or use current location.";
    }

    return `${marker[0].toFixed(6)}, ${marker[1].toFixed(6)}`;
  }, [marker]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      setError("Type a location to search.");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`,
      );
      const data = (await response.json()) as NominatimSearchResult[];

      if (!response.ok || data.length === 0) {
        setError("No matching location found.");
        return;
      }

      const nextPoint: MapPoint = [Number(data[0].lat), Number(data[0].lon)];
      setCenter(nextPoint);
      setMarker(nextPoint);
      setZoom(FOCUSED_ZOOM);
      setLocationName(data[0].display_name);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  function handlePin(position: MapPoint) {
    setCenter(position);
    setMarker(position);
    setZoom(FOCUSED_ZOOM);
    setLocationName("Pinned map location");
    setError(null);
  }

  function handleLocateMe() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available on this device.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPoint: MapPoint = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setCenter(nextPoint);
        setMarker(nextPoint);
        setZoom(FOCUSED_ZOOM);
        setLocationName("Current location");
        setIsLocating(false);
      },
      () => {
        setError("Unable to fetch current location.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true },
    );
  }

  function handleClearPin() {
    setMarker(null);
    setCenter(DEFAULT_CENTER);
    setZoom(DEFAULT_ZOOM);
    setLocationName("Hazaribagh");
    setError(null);
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-slate-900">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} zoom={zoom} />
        <ClickToPin onPin={handlePin} />
        {marker ? (
          <Marker position={marker} icon={markerIcon}>
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-slate-800">{locationName}</p>
                <p className="text-slate-600">{markerText}</p>
              </div>
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 z-[1000] flex flex-col justify-between p-3 sm:p-4">
        <section className="pointer-events-auto mx-auto w-full max-w-4xl rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xl backdrop-blur-sm sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Full Page OpenStreetMap
              </p>
              <h1 className="text-lg font-semibold text-slate-800 sm:text-xl">
                Street Map
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white"
              >
                Citizen Portal
              </Link>
              <Link
                href="/mayor"
                className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white"
              >
                Mayor Dashboard
              </Link>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="street-map-search">
              Search location
            </label>
            <input
              id="street-map-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search place, area, or landmark"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none ring-blue-400 transition focus:ring-2"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search className="h-4 w-4" />
                {isSearching ? "Searching..." : "Search"}
              </button>
              <button
                type="button"
                disabled={isLocating}
                onClick={handleLocateMe}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LocateFixed className="h-4 w-4" />
                {isLocating ? "Locating..." : "My location"}
              </button>
              <button
                type="button"
                onClick={handleClearPin}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-slate-600 transition hover:bg-slate-100"
                aria-label="Clear marker"
                title="Clear marker"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>

        <section className="pointer-events-auto ml-auto w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xl backdrop-blur-sm">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
            <MapPinned className="h-4 w-4" />
            Selected Location
          </div>
          <p className="text-sm font-semibold text-slate-800">{locationName}</p>
          <p className="mt-1 font-mono text-xs text-slate-600">{markerText}</p>
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}



