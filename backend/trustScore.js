export const TRUST_WINDOW_DAYS = 30;

const TRUST_RADIUS_KM = 50;
const SEVERITY_PENALTY = { low: 3, medium: 8, high: 15 };
const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

// Haversine distance between two { lat, lng } points
export function distanceKm(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Each recent flag near a mandi lowers its trust score according to severity.
export function applyContaminationPenalties(mandis, recentFlags) {
  return mandis.map(({ baseTrustScore, ...mandi }) => {
    const nearbyFlags = recentFlags.filter((flag) => distanceKm(mandi, flag) <= TRUST_RADIUS_KM);
    const trustPenalty = nearbyFlags.reduce((total, flag) => total + SEVERITY_PENALTY[flag.severity], 0);

    return {
      ...mandi,
      supplyTrustScore: Math.max(0, baseTrustScore - trustPenalty),
      trustPenalty,
      nearbyFlagCount: nearbyFlags.length,
    };
  });
}
