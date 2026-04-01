"use client";

import L from "leaflet";
import { ArrowLeft, LocateFixed, Navigation } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, ZoomControl } from "react-leaflet";

type StreetProperties = {
  highway?: unknown;
  luminosity?: number | string | null;
  name?: unknown;
};

type StreetGeometry = {
  type: "LineString" | "MultiLineString";
  coordinates: unknown;
};

type StreetFeature = {
  geometry?: StreetGeometry | null;
  properties?: StreetProperties | null;
  type: "Feature";
};

type StreetChunkResponse = {
  features: StreetFeature[];
  hasMore: boolean;
  limit: number;
  offset: number;
  totalFeatures: number;
  type: "FeatureCollection";
};

type RenderProgress = {
  rendered: number;
  total: number;
};

type RenderStatus = "idle" | "loading" | "animating" | "ready" | "error";

type ColorStop = {
  color: [number, number, number];
  value: number;
};

const DEFAULT_CENTER: [number, number] = [23.9925, 85.3636];
const DEFAULT_ZOOM = 13;
const USER_ZOOM = 16;

const FETCH_CHUNK_SIZE = 220;
const RENDER_BATCH_SIZE = 24;
const RENDER_INTERVAL_MS = 26;

const LUMINOSITY_COLOR_STOPS: ColorStop[] = [
  { value: 0, color: [10, 42, 255] },
  { value: 0.34, color: [0, 229, 255] },
  { value: 0.67, color: [124, 255, 0] },
  { value: 1, color: [255, 247, 0] },
];

function clampLuminosity(value: unknown) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  if (numeric < 0) {
    return 0;
  }

  if (numeric > 1) {
    return 1;
  }

  return numeric;
}

function toHex(value: number) {
  return Math.round(value).toString(16).padStart(2, "0").toUpperCase();
}

function interpolateChannel(start: number, end: number, factor: number) {
  return start + (end - start) * factor;
}

function luminosityToColor(value: number) {
  const clamped = clampLuminosity(value);

  for (let index = 1; index < LUMINOSITY_COLOR_STOPS.length; index += 1) {
    const upperStop = LUMINOSITY_COLOR_STOPS[index];

    if (clamped > upperStop.value) {
      continue;
    }

    const lowerStop = LUMINOSITY_COLOR_STOPS[index - 1];
    const span = upperStop.value - lowerStop.value;
    const factor = span === 0 ? 0 : (clamped - lowerStop.value) / span;

    const red = interpolateChannel(lowerStop.color[0], upperStop.color[0], factor);
    const green = interpolateChannel(lowerStop.color[1], upperStop.color[1], factor);
    const blue = interpolateChannel(lowerStop.color[2], upperStop.color[2], factor);

    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
  }

  const lastStop = LUMINOSITY_COLOR_STOPS[LUMINOSITY_COLOR_STOPS.length - 1];
  return `#${toHex(lastStop.color[0])}${toHex(lastStop.color[1])}${toHex(lastStop.color[2])}`;
}

function toLatLngPath(points: unknown): [number, number][] {
  if (!Array.isArray(points)) {
    return [];
  }

  const path: [number, number][] = [];

  for (const point of points) {
    if (!Array.isArray(point) || point.length < 2) {
      continue;
    }

    const lng = Number(point[0]);
    const lat = Number(point[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      continue;
    }

    path.push([lat, lng]);
  }

  return path;
}

function geometryToPaths(geometry: StreetGeometry | null | undefined) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === "LineString") {
    const path = toLatLngPath(geometry.coordinates);
    return path.length > 1 ? [path] : [];
  }

  if (!Array.isArray(geometry.coordinates)) {
    return [];
  }

  return geometry.coordinates
    .map((line) => toLatLngPath(line))
    .filter((path) => path.length > 1);
}

function normalizeStreetName(properties: StreetProperties | null | undefined) {
  const rawName = normalizeText(properties?.name);

  if (rawName && rawName.toLowerCase() !== "nan") {
    return rawName;
  }

  const highway = normalizeText(properties?.highway);

  if (highway) {
    return `${highway[0].toUpperCase()}${highway.slice(1)} road`;
  }

  return "Unnamed street";
}

function normalizeText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const text = normalizeText(item);
      if (text) {
        return text;
      }
    }
  }

  return null;
}

function luminosityBand(value: number) {
  if (value < 0.34) {
    return "Low";
  }

  if (value < 0.67) {
    return "Medium";
  }

  return "High";
}

function MapTools() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  function recenterToCity() {
    setLocationError(null);
    map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported on this browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        map.flyTo([position.coords.latitude, position.coords.longitude], USER_ZOOM, {
          duration: 0.9,
        });
      },
      () => {
        setIsLocating(false);
        setLocationError("Could not get your live location.");
      },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute right-3 top-1/2 z-[1000] flex -translate-y-1/2 flex-col gap-2 sm:right-4 sm:top-24 sm:translate-y-0">
        <button
          type="button"
          onClick={locateMe}
          className="glass-overlay pointer-events-auto inline-flex min-w-[132px] items-center justify-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-50 shadow-xl transition hover:bg-white/20 sm:text-xs"
        >
          <LocateFixed className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
          {isLocating ? "Locating" : "My Location"}
        </button>
        <button
          type="button"
          onClick={recenterToCity}
          className="glass-overlay pointer-events-auto inline-flex min-w-[132px] items-center justify-center gap-2 rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-50 shadow-xl transition hover:bg-white/20 sm:text-xs"
        >
          <Navigation className="h-3.5 w-3.5" />
          Recenter
        </button>
      </div>

      {locationError ? (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[1000] flex justify-center">
          <p className="glass-overlay rounded-full px-4 py-2 text-xs font-medium text-rose-200 shadow-xl">
            {locationError}
          </p>
        </div>
      ) : null}
    </>
  );
}

function LuminosityRoadLayer({
  onProgressChange,
  onStatusChange,
}: {
  onProgressChange: (progress: RenderProgress) => void;
  onStatusChange: (status: RenderStatus, message?: string) => void;
}) {
  const map = useMap();
  const animationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    let disposed = false;
    const roadLayer = L.layerGroup().addTo(map);

    const clearAnimationTimer = () => {
      if (animationTimerRef.current == null) {
        return;
      }

      window.clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    };

    const drawStreetFeature = (feature: StreetFeature) => {
      const paths = geometryToPaths(feature.geometry);

      if (paths.length === 0) {
        return;
      }

      const luminosity = clampLuminosity(feature.properties?.luminosity);
      const color = luminosityToColor(luminosity);
      const streetName = normalizeStreetName(feature.properties);
      const level = luminosityBand(luminosity);

      for (const path of paths) {
        const streetLine = L.polyline(path, {
          className: "luminosity-road",
          color,
          lineCap: "round",
          lineJoin: "round",
          opacity: 0,
          weight: 2.6,
        });

        streetLine.bindTooltip(`${streetName} | ${level} (${luminosity.toFixed(2)})`, {
          className: "luminosity-tooltip",
          sticky: true,
        });

        streetLine.addTo(roadLayer);

        requestAnimationFrame(() => {
          streetLine.setStyle({ opacity: 0.92 });
        });
      }
    };

    const drawChunkAnimated = (
      features: StreetFeature[],
      renderedBefore: number,
      total: number,
    ) =>
      new Promise<void>((resolve) => {
        let cursor = 0;

        const drawNextBatch = () => {
          if (disposed) {
            resolve();
            return;
          }

          const batchEnd = Math.min(cursor + RENDER_BATCH_SIZE, features.length);

          for (; cursor < batchEnd; cursor += 1) {
            drawStreetFeature(features[cursor]);
          }

          onProgressChange({ rendered: renderedBefore + batchEnd, total });

          if (batchEnd < features.length) {
            animationTimerRef.current = window.setTimeout(
              drawNextBatch,
              RENDER_INTERVAL_MS,
            );
            return;
          }

          resolve();
        };

        drawNextBatch();
      });

    const loadRoads = async () => {
      onStatusChange("loading");
      onProgressChange({ rendered: 0, total: 0 });

      try {
        let hasMore = true;
        let offset = 0;
        let renderedTotal = 0;
        let totalFeatures = 0;

        while (hasMore && !disposed) {
          const response = await fetch(
            `/api/street-luminosity?offset=${offset}&limit=${FETCH_CHUNK_SIZE}`,
            {
              cache: "force-cache",
              signal: abortController.signal,
            },
          );

          if (!response.ok) {
            throw new Error(`Street API failed with status ${response.status}`);
          }

          const payload = (await response.json()) as StreetChunkResponse;
          const chunkFeatures = Array.isArray(payload.features) ? payload.features : [];
          const chunkTotal = Number(payload.totalFeatures);

          if (Number.isFinite(chunkTotal) && chunkTotal >= 0) {
            totalFeatures = chunkTotal;
          }

          if (totalFeatures === 0) {
            onStatusChange("ready");
            onProgressChange({ rendered: 0, total: 0 });
            return;
          }

          if (offset === 0) {
            onStatusChange("animating");
            onProgressChange({ rendered: 0, total: totalFeatures });
          }

          await drawChunkAnimated(chunkFeatures, renderedTotal, totalFeatures);

          renderedTotal += chunkFeatures.length;
          offset += chunkFeatures.length;
          hasMore = Boolean(payload.hasMore);

          if (chunkFeatures.length === 0) {
            hasMore = false;
          }
        }

        if (!disposed) {
          onProgressChange({ rendered: renderedTotal, total: totalFeatures });
          onStatusChange("ready");
        }
      } catch (error) {
        if (disposed || abortController.signal.aborted) {
          return;
        }

        console.error("Failed loading street luminosity geojson", error);
        onStatusChange("error", "Unable to load street luminosity data.");
      }
    };

    void loadRoads();

    return () => {
      disposed = true;
      abortController.abort();
      clearAnimationTimer();
      roadLayer.clearLayers();
      map.removeLayer(roadLayer);
    };
  }, [map, onProgressChange, onStatusChange]);

  return null;
}

export function StreetMapViewClient() {
  const [status, setStatus] = useState<RenderStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<RenderProgress>({ rendered: 0, total: 0 });
  const [isLoadPanelOpen, setIsLoadPanelOpen] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const completion = useMemo(() => {
    if (progress.total === 0) {
      return 0;
    }

    return Math.round((progress.rendered / progress.total) * 100);
  }, [progress.rendered, progress.total]);

  const isFullyLoaded = useMemo(() => {
    return (
      status === "ready" &&
      progress.total > 0 &&
      progress.rendered >= progress.total
    );
  }, [progress.rendered, progress.total, status]);

  const statusLabel = useMemo(() => {
    if (status === "loading") {
      return "Loading GeoJSON from backend API";
    }

    if (status === "animating") {
      return `Drawing roads ${completion}%`;
    }

    if (status === "ready") {
      return "Road luminosity map ready";
    }

    if (status === "error") {
      return "Street data failed to load";
    }

    return "Preparing map";
  }, [completion, status]);

  const statusTone = useMemo(() => {
    if (status === "error") {
      return "text-rose-200";
    }

    if (status === "ready") {
      return "text-emerald-200";
    }

    return "text-sky-200";
  }, [status]);

  const handleProgressChange = useCallback((nextProgress: RenderProgress) => {
    setProgress(nextProgress);
  }, []);

  const handleStatusChange = useCallback((nextStatus: RenderStatus, message?: string) => {
    setStatus(nextStatus);
    setStatusMessage(message ?? null);
  }, []);

  const handleResetData = useCallback(() => {
    setStatus("idle");
    setStatusMessage(null);
    setProgress({ rendered: 0, total: 0 });
    setIsLoadPanelOpen(false);
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (isFullyLoaded) {
      setIsLoadPanelOpen(false);
    }
  }, [isFullyLoaded]);

  return (
    <section className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        scrollWheelZoom
        className="street-map-dark h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <ZoomControl position="bottomright" />
        <MapTools />
        <LuminosityRoadLayer
          key={reloadKey}
          onProgressChange={handleProgressChange}
          onStatusChange={handleStatusChange}
        />
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="glass-overlay pointer-events-auto w-full rounded-2xl px-4 py-3 shadow-xl sm:w-auto sm:min-w-[320px] sm:max-w-[560px]">
          <button
            type="button"
            onClick={() => setIsLoadPanelOpen((current) => !current)}
            className="w-full text-left"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
              OpenStreetMap Night View
            </p>
            <h1 className="mt-1 text-lg font-semibold text-slate-50">Street Luminosity</h1>
          </button>

          {isLoadPanelOpen ? (
            <>
              <p className="mt-1 text-xs leading-relaxed text-slate-200/95 sm:text-sm">
                This map tracks street-light condition and overall lighting condition across
                every street of Hazaribagh.
              </p>

              <div
                className={`mt-3 inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold ${statusTone}`}
              >
                {statusLabel}
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-200">
                  <span>Rendered segments</span>
                  <span>
                    {progress.rendered}/{progress.total || "..."}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white/80 transition-all duration-200"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              {statusMessage ? (
                <p className="mt-2 text-xs font-medium text-rose-200">{statusMessage}</p>
              ) : null}

              <div className="mt-3 flex">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-100 transition hover:bg-white/20"
                >
                  Reset Data
                </button>
              </div>
            </>
          ) : null}
        </div>

        <Link
          href="/"
          className="glass-overlay pointer-events-auto inline-flex self-start items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-slate-50 shadow-xl transition hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1000] flex justify-center sm:justify-start">
        <section className="glass-overlay pointer-events-auto w-[min(94vw,460px)] rounded-2xl p-4 shadow-xl sm:w-[420px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
            Luminosity Level
          </p>
          <div
            className="mt-2 h-2.5 w-full rounded-full"
            style={{
              background:
                "linear-gradient(90deg, #0A2AFF 0%, #00E5FF 33%, #7CFF00 66%, #FFF700 100%)",
            }}
          />
         
        </section>
      </div>
    </section>
  );
}

