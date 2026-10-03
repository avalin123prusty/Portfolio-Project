import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env.js';
import { authenticateToken, optionalAuthentication, requireAdmin } from './middleware/auth.js';
import { consumeRefreshSession, createRefreshSession, readStore, verifyPassword, writeStore } from './utils/fileStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.disable('x-powered-by');
const loginAttempts = new Map();
const contactAttempts = new Map();
const mailer = env.SMTP_HOST ? nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined
}) : null;

const uploadDir = path.resolve(__dirname, '..', env.UPLOAD_PATH);
fs.mkdirSync(uploadDir, { recursive: true });

const allowedImageTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif']
]);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${allowedImageTypes.get(file.mimetype) || '.bin'}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.has(file.mimetype)) {
      return cb(new Error('Unsupported image type. Use JPEG, PNG, WEBP, or GIF.'));
    }
    return cb(null, true);
  }
});

function hasValidImageSignature(filePath, mimeType) {
  const buffer = Buffer.alloc(12);
  const descriptor = fs.openSync(filePath, 'r');
  let bytesRead;
  try {
    bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  if (mimeType === 'image/png') return bytesRead >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  if (mimeType === 'image/jpeg') return bytesRead >= 3 && buffer.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
  if (mimeType === 'image/gif') return buffer.subarray(0, 6).toString('ascii').startsWith('GIF8');
  if (mimeType === 'image/webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return false;
}

app.set('trust proxy', 1);
const allowedOrigins = new Set([
  env.CLIENT_URL,
  env.CMS_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  ...env.CORS_ORIGINS
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (env.NODE_ENV === 'production') res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.use('/uploads', express.static(uploadDir));

function throttle(map, limit, windowMs, message) {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const attempts = (map.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
    if (attempts.length >= limit) {
      return res.status(429).json({ message });
    }
    attempts.push(now);
    map.set(key, attempts);
    return next();
  };
}

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, tokenType: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

function createRefreshToken(user) {
  const tokenId = uuidv4();
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, tokenType: 'refresh' }, env.REFRESH_TOKEN_SECRET, {
    jwtid: tokenId,
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN
  });
  createRefreshSession(tokenId, user.id, jwt.decode(token).exp * 1000);
  return token;
}

const requiredFields = {
  skills: ['name'],
  projects: ['title', 'description'],
  blogs: ['title', 'content'],
  experience: ['company', 'role'],
  testimonials: ['name', 'quote'],
  services: ['title', 'description']
};

function validateContent(resourceName, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return `${resourceName} payload must be a JSON object.`;
  }
  const missing = (requiredFields[resourceName] || []).filter((field) => !String(payload[field] || '').trim());
  if (missing.length) {
    return `Required fields: ${missing.join(', ')}.`;
  }
  return null;
}

function makeGenericCrud(resourceName, { isSingle = false, adminOnlyRead = false } = {}) {
  return {
    get: (req, res) => {
      if (adminOnlyRead && req.user?.role !== 'admin') {
        return res.status(401).json({ message: 'Administrator authentication is required.' });
      }
      const store = readStore();
      const item = store[resourceName];
      if (isSingle) {
        return res.json(item || {});
      }
      const collection = Array.isArray(item) ? item : [];
      if (['projects', 'blogs'].includes(resourceName) && req.user?.role !== 'admin') {
        return res.json(collection.filter((entry) => entry.status !== 'draft'));
      }
      return res.json(collection);
    },
    post: (req, res) => {
      const validationError = validateContent(resourceName, req.body);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
      const store = readStore();
      const payload = req.body;
      const collection = Array.isArray(store[resourceName]) ? store[resourceName] : [];
      const item = {
        ...payload,
        id: payload.id || payload._id || uuidv4()
      };
      collection.push(item);
      store[resourceName] = collection;
      writeStore(store);
      return res.status(201).json(item);
    },
    put: (req, res) => {
      const validationError = validateContent(resourceName, req.body);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
      const store = readStore();
      const payload = req.body;
      const id = req.params.id || payload.id || payload._id;
      const collection = Array.isArray(store[resourceName]) ? store[resourceName] : [];

      if (isSingle) {
        store[resourceName] = { ...(store[resourceName] || {}), ...payload };
        writeStore(store);
        return res.json(store[resourceName]);
      }

      if (!id) {
        return res.status(400).json({ message: `An item id is required for ${resourceName}.` });
      }

      const index = collection.findIndex((entry) => entry.id === id || entry._id === id);
      if (index === -1) {
        return res.status(404).json({ message: `${resourceName} item not found.` });
      }
      collection[index] = { ...collection[index], ...payload, id: id };
      store[resourceName] = collection;
      writeStore(store);
      return res.json(collection[index]);
    },
    del: (req, res) => {
      const store = readStore();
      const id = req.params.id;
      const collection = Array.isArray(store[resourceName]) ? store[resourceName] : [];

      if (isSingle) {
        store[resourceName] = {};
        writeStore(store);
        return res.json({ message: `${resourceName} reset.` });
      }

      const nextCollection = collection.filter((entry) => entry.id !== id && entry._id !== id);
      store[resourceName] = nextCollection;
      writeStore(store);
      return res.json({ message: `${resourceName} deleted successfully.` });
    }
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', throttle(loginAttempts, 10, 15 * 60 * 1000, 'Too many login attempts. Try again later.'), (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password || password.length > 256) {
    return res.status(400).json({ message: 'A valid email and password are required.' });
  }
  const store = readStore();
  const userRecord = (store.users || []).find((user) => user.email.toLowerCase() === email);

  if (!userRecord || !verifyPassword(password, userRecord.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const user = { id: userRecord.id, email: userRecord.email, role: userRecord.role || 'admin' };
  return res.json({
    user,
    token: createToken(user),
    refreshToken: createRefreshToken(user),
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const token = req.body?.refreshToken || req.body?.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Refresh token missing.' });
  }

  try {
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    if (decoded.tokenType !== 'refresh') {
      return res.status(403).json({ message: 'A refresh token is required.' });
    }
    if (!consumeRefreshSession(decoded.jti, decoded.id)) {
      return res.status(403).json({ message: 'Refresh token is invalid, expired, or already used.' });
    }
    const user = { id: decoded.id, email: decoded.email, role: decoded.role };
    return res.json({ token: createToken(user), refreshToken: createRefreshToken(user), user, expiresIn: env.JWT_EXPIRES_IN, refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN });
  } catch (_error) {
    return res.status(403).json({ message: 'Invalid refresh token.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.body?.refreshToken;
  if (!token) {
    return res.status(204).end();
  }
  try {
    const decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
    if (decoded.tokenType === 'refresh') consumeRefreshSession(decoded.jti, decoded.id);
  } catch {}
  return res.status(204).end();
});

app.get('/api/admin/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/admin/analytics', authenticateToken, requireAdmin, (_req, res) => {
  const store = readStore();
  const messages = Array.isArray(store.messages) ? store.messages : [];
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  res.json({
    totals: {
      projects: (store.projects || []).length,
      skills: (store.skills || []).length,
      blogs: (store.blogs || []).length,
      experience: (store.experience || []).length,
      testimonials: (store.testimonials || []).length,
      services: (store.services || []).length,
      messages: messages.length
    },
    recentMessages: messages.filter((item) => Date.parse(item.createdAt) >= since).length,
    latestMessages: messages.slice(-5).reverse()
  });
});

const contentModelCatalog = [
  { name: 'about', type: 'single' },
  { name: 'skills', type: 'collection' },
  { name: 'projects', type: 'collection' },
  { name: 'blogs', type: 'collection' },
  { name: 'experience', type: 'collection' },
  { name: 'testimonials', type: 'collection' },
  { name: 'services', type: 'collection' },
  { name: 'messages', type: 'collection' },
  { name: 'media', type: 'collection' }
];

app.get('/api/about', makeGenericCrud('about', { isSingle: true }).get);
app.put('/api/about', authenticateToken, requireAdmin, makeGenericCrud('about', { isSingle: true }).put);

contentModelCatalog.forEach(({ name, type }) => {
  if (name === 'messages' || name === 'media') {
    return;
  }
  const handlers = makeGenericCrud(name, { isSingle: type === 'single' });
  const readMiddleware = ['projects', 'blogs'].includes(name) ? [optionalAuthentication] : [];
  app.get(`/api/${name}`, ...readMiddleware, handlers.get);

  if (type === 'single') {
    app.put(`/api/${name}`, authenticateToken, handlers.put);
    return;
  }

  app.post(`/api/${name}`, authenticateToken, requireAdmin, handlers.post);
  app.put(`/api/${name}`, authenticateToken, requireAdmin, handlers.put);
  app.put(`/api/${name}/:id`, authenticateToken, requireAdmin, handlers.put);
  app.delete(`/api/${name}/:id`, authenticateToken, requireAdmin, handlers.del);
});

const messageHandlers = makeGenericCrud('messages', { adminOnlyRead: true });
app.get('/api/messages', authenticateToken, requireAdmin, messageHandlers.get);
app.delete('/api/messages/:id', authenticateToken, requireAdmin, messageHandlers.del);

app.get('/api/content-models', (_req, res) => {
  res.json({
    models: contentModelCatalog,
    message: 'Portfolio content models ready for CRUD operations.'
  });
});

app.post('/api/contact', throttle(contactAttempts, env.CONTACT_RATE_LIMIT, 15 * 60 * 1000, 'Too many messages. Please try again later.'), async (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const message = String(req.body?.message || '').trim();
  if (!name || name.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || message.length < 10 || message.length > 5000) {
    return res.status(400).json({ message: 'Enter a valid name, email, and message between 10 and 5000 characters.' });
  }

  const store = readStore();
  const entry = {
    id: uuidv4(),
    name,
    email,
    message,
    createdAt: new Date().toISOString()
  };
  store.messages.push(entry);
  writeStore(store);

  let emailSent = false;
  if (mailer) {
    try {
      await mailer.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER,
        to: env.CONTACT_TO,
        replyTo: email,
        subject: `Portfolio inquiry from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`
      });
      emailSent = true;
    } catch (error) {
      console.error('Contact email delivery failed:', error.message);
    }
  }

  return res.status(201).json({ message: 'Your message was received successfully.', emailSent });
});

app.post('/api/upload/image', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded.' });
  }

  if (!hasValidImageSignature(req.file.path, req.file.mimetype)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'The uploaded file is not a valid image.' });
  }

  const publicUrl = `${env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`}/uploads/${req.file.filename}`;
  const store = readStore();
  const mediaEntry = {
    id: uuidv4(),
    name: req.file.originalname,
    url: publicUrl,
    mimetype: req.file.mimetype,
    size: req.file.size,
    createdAt: new Date().toISOString()
  };

  store.media = Array.isArray(store.media) ? store.media : [];
  store.media.push(mediaEntry);
  writeStore(store);

  return res.status(201).json({
    message: 'Image uploaded successfully.',
    item: mediaEntry,
    url: publicUrl
  });
});

app.get('/api/media', authenticateToken, requireAdmin, (_req, res) => {
  const store = readStore();
  res.json(Array.isArray(store.media) ? store.media : []);
});

app.delete('/api/media/:id', authenticateToken, requireAdmin, (req, res) => {
  const store = readStore();
  const item = (store.media || []).find((media) => media.id === req.params.id);
  if (!item) {
    return res.status(404).json({ message: 'Media item not found.' });
  }
  const filename = path.basename(new URL(item.url).pathname);
  const filePath = path.resolve(uploadDir, filename);
  if (filePath.startsWith(`${uploadDir}${path.sep}`) && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  store.media = store.media.filter((media) => media.id !== req.params.id);
  writeStore(store);
  return res.json({ message: 'Media item deleted.' });
});

app.get('/', (_req, res) => {
  res.json({
    name: 'Portfolio CMS API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/about',
      '/api/skills',
      '/api/projects',
      '/api/blogs',
      '/api/contact',
      '/api/auth/login'
    ]
  });
});

app.use('/api', (_req, res) => res.status(404).json({ message: 'API endpoint not found.' }));

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : error.message });
  }
  if (error.message === 'Origin is not allowed by CORS.') {
    return res.status(403).json({ message: error.message });
  }
  if (error.message.startsWith('Unsupported image type.')) {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: 'An unexpected server error occurred.' });
});

const port = env.PORT;
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMainModule) {
  app.listen(port, () => {
    console.log(`Backend API running on http://localhost:${port}`);
  });
}

export { app };
