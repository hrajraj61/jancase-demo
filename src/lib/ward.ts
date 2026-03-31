export function calculateWard(latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) {
    return null;
  }

  const latBand = Math.min(3, Math.max(0, Math.floor((latitude - 24.0) / 0.01)));
  const lngBand = Math.min(2, Math.max(0, Math.floor((longitude - 85.34) / 0.02)));

  return latBand * 3 + lngBand + 1;
}
