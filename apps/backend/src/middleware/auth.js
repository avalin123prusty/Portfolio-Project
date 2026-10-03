import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.tokenType !== 'access') {
      return res.status(403).json({ message: 'An access token is required.' });
    }
    req.user = decoded;
    return next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Administrator access is required.' });
  }
  return next();
}

export function optionalAuthentication(req, res, next) {
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }
  return authenticateToken(req, res, next);
}
