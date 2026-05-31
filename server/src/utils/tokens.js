import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
}

export function signRefreshToken(payload, rememberMe = false) {
  const expiresIn = rememberMe ? '30d' : process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = hashToken(token);
  const expires = new Date(Date.now() + 3600000);
  return { token, hash, expires };
}
