import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyLivePrices,
  buildRecommendation,
  buildTrend,
  planHarvest,
  projectPrice,
  rankMandis,
} from '../forecast.js';

const weeks = (prices) => prices.map((actual, i) => ({ week: `W${i + 1}`, actual }));
const mandi = (name, crop, lat, lng, currentPrice, supplyTrustScore = 80) => ({ name, crop, lat, lng, currentPrice, supplyTrustScore });

const tomatoTrend = buildTrend(weeks([290, 310, 295, 330, 305, 340, 360, 380]));
const flatTrend = buildTrend(weeks([100, 100, 100]));
const origin = { lat: 13.1369, lng: 78.1294 };

describe('buildTrend', () => {
  it('extends the 8-week history by 3 forecast weeks', () => {
    assert.equal(tomatoTrend.series.length, 11);
    assert.deepEqual(tomatoTrend.series[0], { week: 'W1', actual: 290 });
    assert.deepEqual(tomatoTrend.series.slice(8).map((p) => p.week), ['W9', 'W10', 'W11']);
  });

  it('matches a hand-calculated straight line', () => {
    assert.deepEqual(tomatoTrend.series.slice(8).map((p) => p.forecast), [379, 391, 403]);
    assert.equal(tomatoTrend.rSquared.toFixed(2), '0.81');
  });

  it('gives a range that surrounds the forecast and widens over time', () => {
    const [first, , last] = tomatoTrend.series.slice(8);
    assert.ok(first.min < first.forecast && first.forecast < first.max);
    assert.ok(last.max - last.min > first.max - first.min);
  });

  it('treats unchanging prices as flat with a perfect fit', () => {
    const flat = buildTrend(weeks([200, 200, 200, 200]));
    assert.equal(flat.weeklyChange, 0);
    assert.equal(flat.rSquared, 1);
    assert.deepEqual(flat.series[4], { week: 'W5', forecast: 200, min: 200, max: 200 });
  });

  it('makes no forecast from too little history', () => {
    assert.deepEqual(buildTrend(weeks([100, 110])).series.length, 2);
    assert.equal(buildTrend([]).weeklyChange, 0);
  });
});

describe('projectPrice', () => {
  it('leaves today unchanged', () => {
    assert.equal(projectPrice(300, tomatoTrend, 0), 300);
  });

  it('stops extrapolating at the forecast horizon', () => {
    assert.equal(projectPrice(300, tomatoTrend, 100), projectPrice(300, tomatoTrend, 21));
  });
});

describe('planHarvest', () => {
  it('harvests perishable tomatoes at maturity', () => {
    assert.deepEqual(planHarvest(6, tomatoTrend, 'Tomato'), { startDay: 6, endDay: 10, waitDays: 0 });
  });

  it('never waits when prices are falling', () => {
    assert.equal(planHarvest(10, buildTrend(weeks([300, 290, 280, 270, 260])), 'Maize').waitDays, 0);
  });

  it('waits when prices are climbing and the crop keeps well', () => {
    assert.ok(planHarvest(2, buildTrend(weeks([100, 110, 120, 130, 140, 150])), 'Maize').waitDays > 0);
  });

  it('keeps the window within how long the crop can wait', () => {
    assert.ok(planHarvest(6, tomatoTrend, 'Tomato').endDay <= 11);
    assert.ok(planHarvest(0, buildTrend(weeks([100, 110, 120])), 'Maize').endDay <= 21);
  });

  it('falls back to cautious settings for an unknown crop', () => {
    assert.equal(planHarvest(3, tomatoTrend, 'Mango').waitDays, 0);
  });
});

describe('rankMandis', () => {
  const nearLowTrust = mandi('Near Low Trust', 'Tomato', 13.14, 78.13, 400, 20);
  const middle = mandi('Middle', 'Tomato', 12.9716, 77.5946, 310);
  const farAway = mandi('Far Away', 'Tomato', 12.2958, 74.0, 900);
  const otherCrop = mandi('Other Crop', 'Onion', 13.14, 78.13, 999);
  const rank = (mandis) => rankMandis({ origin, crop: 'Tomato', mandis, trend: flatTrend, saleDay: 5 }).map((o) => o.mandi.name);

  it('skips low-trust, out-of-range and other-crop mandis', () => {
    assert.deepEqual(rank([nearLowTrust, middle, farAway, otherCrop]), ['Middle']);
  });

  it('falls back to a low-trust mandi when nothing else is in range', () => {
    assert.deepEqual(rank([nearLowTrust, farAway]), ['Near Low Trust']);
  });

  it('returns nothing when no mandi trades the crop', () => {
    assert.deepEqual(rank([otherCrop]), []);
  });

  it('lets a nearer mandi beat a higher price once transport is counted', () => {
    const closer = mandi('Closer', 'Tomato', 13.14, 78.2, 300);
    const farther = mandi('Farther', 'Tomato', 12.9716, 77.5946, 320);
    assert.equal(rank([farther, closer])[0], 'Closer');
  });

  it('subtracts transport from the sale price', () => {
    const [best] = rankMandis({ origin, crop: 'Tomato', mandis: [middle], trend: flatTrend, saleDay: 5 });
    assert.equal(best.netPrice, best.salePrice - best.transportCost);
  });
});

describe('buildRecommendation', () => {
  const plan = { id: 'p1', zone: 'Kolar', crop: 'Tomato', daysToMaturity: 6, centerLat: origin.lat, centerLng: origin.lng };
  const options = [mandi('Middle', 'Tomato', 12.9716, 77.5946, 310), mandi('Closer', 'Tomato', 13.14, 78.2, 300)];

  it('explains the advice and compares it with the runner-up', () => {
    const rec = buildRecommendation(plan, tomatoTrend, options);
    assert.equal(rec.insights.length, 3);
    assert.match(rec.reasoning, /more than/);
    assert.match(rec.windowStart, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(rec.confidence >= 30 && rec.confidence <= 95);
  });

  it('warns when the only option is a low-trust mandi', () => {
    const rec = buildRecommendation(plan, flatTrend, [mandi('Risky', 'Tomato', 13.14, 78.13, 400, 20)]);
    assert.match(rec.reasoning, /No trusted mandi/);
  });

  it('returns null when no mandi trades the crop', () => {
    assert.equal(buildRecommendation({ ...plan, crop: 'Mango' }, tomatoTrend, options), null);
  });
});

describe('applyLivePrices', () => {
  const base = [mandi('Bangalore APMC', 'Tomato', 0, 0, 310), mandi('Mysuru APMC', 'Tomato', 0, 0, 295), mandi('Kolar Mandi', 'Tomato', 0, 0, 140)];

  it('uses only records for the same state, town and crop', () => {
    const live = applyLivePrices(base, [
      { state: 'Maharashtra', district: 'Kolar', market: 'Kolar', commodity: 'Tomato', modal_price: '9999' },
      { state: 'Karnataka', district: 'Bangalore', market: 'Binny Mill', commodity: 'Tomato', modal_price: '1500' },
      { state: 'Karnataka', district: 'Mysore', market: 'Mysore', commodity: 'Tomato', modal_price: '1300' },
      { state: 'Karnataka', district: 'Bangalore', market: 'Binny Mill', commodity: 'Onion', modal_price: '777' },
    ]);
    assert.deepEqual(live.map((m) => m.currentPrice), [1500, 1300, 140]);
  });

  it('leaves prices alone when there is no live data', () => {
    assert.deepEqual(applyLivePrices(base, []).map((m) => m.currentPrice), [310, 295, 140]);
  });
});
