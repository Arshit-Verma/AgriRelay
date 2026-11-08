import jwt from 'jsonwebtoken';

const TOKEN_LIFETIME = '12h';
const TOKEN_ALGORITHM = 'HS256';
const BEARER_PREFIX = 'Bearer ';

export function createToken(officer) {
  return jwt.sign({ zone: officer.zone }, process.env.JWT_SECRET, {
    subject: officer.id,
    expiresIn: TOKEN_LIFETIME,
    algorithm: TOKEN_ALGORITHM,
  });
}

// Rejects requests without a valid token and records who is asking on req.officer.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : '';

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [TOKEN_ALGORITHM] });
    req.officer = { id: payload.sub, zone: payload.zone };
  } catch {
    res.status(401).json({ error: 'Sign in required' });
    return;
  }

  next();
}
