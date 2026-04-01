import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

type StreetFeatureCollection = {
  type: "FeatureCollection";
  features: unknown[];
};

const STREET_LUMINOSITY_FILE = path.join(
  process.cwd(),
  "hazaribagh_streets_luminosity.geojson",
);

const DEFAULT_LIMIT = 220;
const MAX_LIMIT = 600;

let cachedStreetLuminosity: StreetFeatureCollection | null = null;

export const runtime = "nodejs";

async function readStreetLuminosityFile() {
  if (cachedStreetLuminosity) {
    return cachedStreetLuminosity;
  }

  const rawPayload = await readFile(STREET_LUMINOSITY_FILE, "utf8");
  const parsedPayload = JSON.parse(rawPayload) as StreetFeatureCollection;

  if (
    parsedPayload.type !== "FeatureCollection" ||
    !Array.isArray(parsedPayload.features)
  ) {
    throw new Error("Invalid street luminosity GeoJSON payload.");
  }

  cachedStreetLuminosity = parsedPayload;
  return parsedPayload;
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const offset = parsePositiveInt(url.searchParams.get("offset"), 0);
    const requestedLimit = parsePositiveInt(
      url.searchParams.get("limit"),
      DEFAULT_LIMIT,
    );
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    const payload = await readStreetLuminosityFile();
    const totalFeatures = payload.features.length;
    const features = payload.features.slice(offset, offset + limit);
    const nextOffset = offset + features.length;
    const hasMore = nextOffset < totalFeatures;

    return NextResponse.json(
      {
        type: "FeatureCollection",
        features,
        totalFeatures,
        offset,
        limit,
        hasMore,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("Unable to read street luminosity GeoJSON", error);
    return NextResponse.json(
      { error: "Unable to load street luminosity data." },
      { status: 500 },
    );
  }
}
