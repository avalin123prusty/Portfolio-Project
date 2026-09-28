import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { env } from './config/env.js';
import { authenticateToken } from './middleware/auth.js';
import { readStore, writeStore } from './utils/fileStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const uploadDir = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage });

app.use(
  cors({
    origin: [env.CLIENT_URL, env.CMS_URL, 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  })
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

function makeGenericCrud(resourceName, { isSingle = false } = {}) {
  return {
    get: (req, res) => {
      const store = readStore();
      const item = store[resourceName];
      if (isSingle) {
        return res.json(item || {});
      }
      return res.json(Array.isArray(item) ? item : []);
    },
    post: (req, res) => {
      const store = readStore();
      const payload = req.body;
      const collection = Array.isArray(store[resourceName]) ? store[resourceName] : [];
      const item = {
        ...payload,
        id: payload.id || uuidv4()
      };
      collection.push(item);
      store[resourceName] = collection;
      writeStore(store);
      return res.status(201).json(item);
    },
    put: (req, res) => {
      const store = readStore();
      const payload = req.body;
      const collection = Array.isArray(store[resourceName]) ? store[resourceName] : [];
      if (isSingle) {
        store[resourceName] = { ...store[resourceName], ...payload };
        writeStore(store);
        return res.json(store[resourceName]);
      }
      const index = collection.findIndex((entry) => entry.id === payload.id || entry._id === payload._id);
      if (index === -1) {
        return res.status(404).json({ message: `${resourceName} item not found.` });
      }
      collection[index] = { ...collection[index], ...payload };
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

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = 'admin@portfolio.local';
  const adminPassword = 'admin123';

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const user = { id: 'admin-1', email: adminEmail, role: 'admin' };
  return res.json({
    user,
    token: createToken(user),
    expiresIn: env.JWT_EXPIRES_IN
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const token = req.body.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Refresh token missing.' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const refreshedToken = createToken(decoded);
    return res.json({ token: refreshedToken, user: decoded, expiresIn: env.JWT_EXPIRES_IN });
  } catch (_error) {
    return res.status(403).json({ message: 'Invalid refresh token.' });
  }
});

app.get('/api/about', makeGenericCrud('about', { isSingle: true }).get);
app.put('/api/about', authenticateToken, makeGenericCrud('about', { isSingle: true }).put);

['skills', 'projects', 'blogs', 'experience', 'testimonials', 'services', 'messages'].forEach((resource) => {
  const handlers = makeGenericCrud(resource);
  app.get(`/api/${resource}`, handlers.get);
  app.post(`/api/${resource}`, authenticateToken, handlers.post);
  app.put(`/api/${resource}`, authenticateToken, handlers.put);
  app.delete(`/api/${resource}/:id`, authenticateToken, handlers.del);
});

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
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

  console.log(`New contact message from ${email}: ${message}`);
  return res.status(201).json({ message: 'Your message was sent successfully.', entry });
});

app.post('/api/upload/image', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No image uploaded.' });
  }

  const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const store = readStore();
  store.media.push({
    id: uuidv4(),
    name: req.file.originalname,
    url: publicUrl,
    createdAt: new Date().toISOString()
  });
  writeStore(store);

  return res.status(201).json({ url: publicUrl, file: req.file });
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

const port = Number(env.PORT) || 5000;
app.listen(port, () => {
  console.log(`Backend API running on http://localhost:${port}`);
});
