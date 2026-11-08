import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { createToken, requireAuth } from '../auth.js';

const SECRET = 'unit-test-secret';
const officer = { id: 'officer-004', zone: 'Kolar' };

function runRequireAuth(authorization) {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;
  requireAuth(req, res, () => {
    nextCalled = true;
  });
  return { req, res, nextCalled };
}

describe('requireAuth', () => {
  before(() => {
    process.env.JWT_SECRET = SECRET;
  });

  it('accepts a valid token and records the officer', () => {
    const { req, nextCalled } = runRequireAuth(`Bearer ${createToken(officer)}`);
    assert.equal(nextCalled, true);
    assert.deepEqual(req.officer, { id: 'officer-004', zone: 'Kolar' });
  });

  it('rejects a missing token', () => {
    const { res, nextCalled } = runRequireAuth(undefined);
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
  });

  it('rejects a token that is not sent as a Bearer token', () => {
    assert.equal(runRequireAuth(createToken(officer)).res.statusCode, 401);
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign({ zone: 'Kolar' }, 'wrong-secret', { subject: 'officer-004' });
    assert.equal(runRequireAuth(`Bearer ${forged}`).res.statusCode, 401);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ zone: 'Kolar' }, SECRET, { subject: 'officer-004', expiresIn: -10 });
    assert.equal(runRequireAuth(`Bearer ${expired}`).res.statusCode, 401);
  });

  it('rejects an unsigned token', () => {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const unsigned = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: 'officer-004', zone: 'Hassan' })}.`;
    assert.equal(runRequireAuth(`Bearer ${unsigned}`).res.statusCode, 401);
  });

  it('rejects a tampered token', () => {
    const [header, , signature] = createToken(officer).split('.');
    const payload = Buffer.from(JSON.stringify({ sub: 'officer-004', zone: 'Hassan' })).toString('base64url');
    assert.equal(runRequireAuth(`Bearer ${header}.${payload}.${signature}`).res.statusCode, 401);
  });
});
