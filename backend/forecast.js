// Simple, explainable market logic: straight-line price trends, harvest timing and mandi routing.
import { distanceKm } from './trustScore.js';

const FORECAST_WEEKS = 3;
export const FORECAST_DAYS = FORECAST_WEEKS * 7;

const MIN_WEEKS_OF_HISTORY = 3;
const FORECAST_BAND_Z_SCORE = 1.28; // covers roughly 80% of outcomes

// How long a crop can stay in the field once ready, and how much value each extra day costs
const CROP_PROFILES = {
  Tomato: { fieldLifeDays: 5, dailyLoss: 0.01 },
  Onion: { fieldLifeDays: 14, dailyLoss: 0.002 },
  Maize: { fieldLifeDays: 21, dailyLoss: 0.001 },
};
const DEFAULT_CROP_PROFILE = { fieldLifeDays: 5, dailyLoss: 0.01 };

const HARVEST_WINDOW_DAYS = 4;
const NEGLIGIBLE_GAIN = 0.005; // don't advise waiting for less than this share of extra value

const TRANSPORT_COST_PER_QUINTAL_KM = 0.5;
const ROUTING_RADIUS_KM = 200;
const MIN_TRUST_SCORE = 40;

// data.gov.in spells some towns differently from our mandi names
const MARKET_NAME_ALIASES = { mysuru: 'mysore', chikkaballapur: 'ballapur', ramanagara: 'ramanagar' };

const sum = (values) => values.reduce((total, value) => total + value, 0);

const dateInDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD
};

// Fits a straight line through weekly prices and extends it FORECAST_WEEKS ahead.
// history is [{ week: 'W1', actual: 290 }, ...], oldest first.
export function buildTrend(history) {
  const actualPoints = history.map(({ week, actual }) => ({ week, actual }));
  const n = history.length;

  if (n < MIN_WEEKS_OF_HISTORY) {
    return { weeks: n, weeklyChange: 0, rSquared: 0, series: actualPoints };
  }

  const prices = history.map((point) => point.actual);
  const meanX = (n - 1) / 2;
  const meanY = sum(prices) / n;
  const sxx = sum(prices.map((_, x) => (x - meanX) ** 2));
  const sxy = sum(prices.map((y, x) => (x - meanX) * (y - meanY)));
  const syy = sum(prices.map((y) => (y - meanY) ** 2));

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const priceAt = (x) => intercept + slope * x;

  const squaredError = sum(prices.map((y, x) => (y - priceAt(x)) ** 2));
  const residualSd = Math.sqrt(squaredError / (n - 2));
  const lastWeekNumber = Number(history[n - 1].week.slice(1));

  const forecastPoints = Array.from({ length: FORECAST_WEEKS }, (_, i) => {
    const x = n + i;
    const halfWidth = FORECAST_BAND_Z_SCORE * residualSd * Math.sqrt(1 + 1 / n + (x - meanX) ** 2 / sxx);
    return {
      week: `W${lastWeekNumber + i + 1}`,
      forecast: Math.round(priceAt(x)),
      min: Math.round(priceAt(x) - halfWidth),
      max: Math.round(priceAt(x) + halfWidth),
    };
  });

  return {
    weeks: n,
    weeklyChange: slope / priceAt(n - 1),
    rSquared: syy === 0 ? 1 : 1 - squaredError / syy,
    series: [...actualPoints, ...forecastPoints],
  };
}

// Applies a crop's trend to a mandi's price. Never extrapolates past the forecast horizon.
export function projectPrice(currentPrice, trend, days) {
  return Math.round(currentPrice * (1 + (trend.weeklyChange * Math.min(days, FORECAST_DAYS)) / 7));
}

// Finds when harvesting earns the most, weighing the price trend against losses from waiting.
export function planHarvest(daysToMaturity, trend, crop) {
  const { fieldLifeDays, dailyLoss } = CROP_PROFILES[crop] ?? DEFAULT_CROP_PROFILE;
  const lastDay = daysToMaturity + fieldLifeDays;
  const days = Array.from({ length: fieldLifeDays + 1 }, (_, i) => daysToMaturity + i);

  const valueOn = (day) => projectPrice(1000, trend, day) * (1 - dailyLoss * (day - daysToMaturity));
  const bestValue = Math.max(...days.map(valueOn));
  const startDay = days.find((day) => valueOn(day) >= bestValue * (1 - NEGLIGIBLE_GAIN));

  return { startDay, endDay: Math.min(startDay + HARVEST_WINDOW_DAYS, lastDay), waitDays: startDay - daysToMaturity };
}

// Ranks mandis by what the farmer keeps after transport. Prefers trusted mandis within range.
export function rankMandis({ origin, crop, mandis, trend, saleDay }) {
  const options = mandis
    .filter((mandi) => mandi.crop === crop)
    .map((mandi) => {
      const distance = Math.round(distanceKm(origin, mandi));
      const salePrice = projectPrice(mandi.currentPrice, trend, saleDay);
      const transportCost = Math.round(distance * TRANSPORT_COST_PER_QUINTAL_KM);
      return { mandi, distance, salePrice, transportCost, netPrice: salePrice - transportCost };
    })
    .sort((a, b) => b.netPrice - a.netPrice);

  const inRange = options.filter((option) => option.distance <= ROUTING_RADIUS_KM);
  const trusted = inRange.filter((option) => option.mandi.supplyTrustScore >= MIN_TRUST_SCORE);

  return [trusted, inRange, options].find((list) => list.length > 0) ?? [];
}

function describeTrend(trend) {
  const percent = Math.abs(trend.weeklyChange * 100).toFixed(1);
  if (trend.weeklyChange >= 0.005) return `rising about ${percent}% a week`;
  if (trend.weeklyChange <= -0.005) return `falling about ${percent}% a week`;
  return 'holding steady';
}

// Turns a crop plan into the full advice shown to the officer. Returns null if no mandi trades the crop.
export function buildRecommendation(plan, trend, mandis) {
  const harvest = planHarvest(plan.daysToMaturity, trend, plan.crop);
  const origin = { lat: plan.centerLat, lng: plan.centerLng };
  const [best, runnerUp] = rankMandis({ origin, crop: plan.crop, mandis, trend, saleDay: harvest.startDay });

  if (!best) return null;

  const timing = harvest.waitDays > 0
    ? `Waiting ${harvest.waitDays} days past maturity earns more than field losses cost.`
    : 'Harvest as soon as it matures, because waiting would not pay for itself.';
  const comparison = runnerUp ? `, ₹${best.netPrice - runnerUp.netPrice}/q more than ${runnerUp.mandi.name}` : '';
  const trustWarning = best.mandi.supplyTrustScore < MIN_TRUST_SCORE ? ' No trusted mandi is in range, so check supply quality first.' : '';
  const weeklyPercent = (trend.weeklyChange * 100).toFixed(1);

  return {
    id: plan.id,
    zone: plan.zone,
    crop: plan.crop,
    daysToOptimalHarvest: harvest.startDay,
    windowStart: dateInDays(harvest.startDay),
    windowEnd: dateInDays(harvest.endDay),
    confidence: Math.max(30, Math.min(95, Math.round(45 + 50 * trend.rSquared - Math.max(0, harvest.startDay - 7) / 3))),
    targetMandi: best.mandi.name,
    currentPrice: best.mandi.currentPrice,
    targetPrice: best.salePrice,
    transportCost: best.transportCost,
    netPrice: best.netPrice,
    distanceKm: best.distance,
    reasoning: `${plan.crop} prices have been ${describeTrend(trend)} over the last ${trend.weeks} weeks. ${timing} ${best.mandi.name} pays the most after transport: ₹${best.netPrice}/q ${best.distance > 0 ? `from ${best.distance} km away` : 'right in your zone'}${comparison}.${trustWarning}`,
    insights: [
      `${trend.weeklyChange >= 0 ? '+' : ''}${weeklyPercent}% a week`,
      `Keeps ₹${best.netPrice}/q`,
      harvest.waitDays > 0 ? `Recommend: wait ${harvest.waitDays} days` : 'Recommend: harvest at maturity',
    ],
  };
}

// Uses a live data.gov.in price only when the record is for this mandi's own town and crop.
export function applyLivePrices(mandis, records) {
  return mandis.map((mandi) => {
    const town = mandi.name.split(' ')[0].toLowerCase();
    const searchTerm = MARKET_NAME_ALIASES[town] ?? town;

    const record = records.find((rec) =>
      rec.state?.toLowerCase() === 'karnataka'
      && rec.commodity?.toLowerCase().includes(mandi.crop.toLowerCase())
      && `${rec.market} ${rec.district}`.toLowerCase().includes(searchTerm)
      && parseFloat(rec.modal_price) > 0);

    return record ? { ...mandi, currentPrice: parseFloat(record.modal_price) } : mandi;
  });
}
