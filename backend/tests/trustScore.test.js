import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { applyContaminationPenalties, distanceKm } from '../trustScore.js';

const kolar = { lat: 13.1369, lng: 78.1294 };
const bangalore = { lat: 12.9716, lng: 77.5946 };
const mandi = { name: 'Kolar Mandi', ...kolar, baseTrustScore: 54 };
const flagAt = (location, severity) => ({ ...location, severity });

describe('distanceKm', () => {
  it('matches the known distance from Kolar to Bangalore', () => {
    assert.equal(Math.round(distanceKm(kolar, bangalore)), 61);
  });

  it('is zero for the same point', () => {
    assert.equal(distanceKm(kolar, kolar), 0);
  });
});

describe('applyContaminationPenalties', () => {
  it('subtracts a penalty for each nearby flag by severity', () => {
    const flags = [flagAt(kolar, 'high'), flagAt(kolar, 'medium'), flagAt(kolar, 'low')];
    const [scored] = applyContaminationPenalties([mandi], flags);
    assert.equal(scored.supplyTrustScore, 28);
    assert.equal(scored.trustPenalty, 26);
    assert.equal(scored.nearbyFlagCount, 3);
  });

  it('ignores flags outside the radius', () => {
    const [scored] = applyContaminationPenalties([mandi], [flagAt(bangalore, 'high')]);
    assert.equal(scored.supplyTrustScore, 54);
    assert.equal(scored.nearbyFlagCount, 0);
  });

  it('never goes below zero', () => {
    const flags = Array.from({ length: 10 }, () => flagAt(kolar, 'high'));
    assert.equal(applyContaminationPenalties([mandi], flags)[0].supplyTrustScore, 0);
  });

  it('does not expose the base score', () => {
    assert.equal('baseTrustScore' in applyContaminationPenalties([mandi], [])[0], false);
  });
});
