import fs from 'fs';
import path from 'path';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const databasePath = path.resolve(dataDir, process.env.DATABASE_FILE || 'portfolio.sqlite');
const legacyStorePath = process.env.LEGACY_STORE_FILE || path.join(dataDir, 'store.json');
const collectionNames = [
  'skills',
  'projects',
  'blogs',
  'experience',
  'testimonials',
  'services',
  'messages',
  'media'
];

let database;

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

const defaultStore = {
  users: [
    {
      id: 'admin-1',
      name: 'Portfolio Admin',
      email: env.ADMIN_EMAIL,
      passwordHash: hashPassword(env.ADMIN_PASSWORD),
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  about: {
    name: 'Ava Lin Prusty',
    title: 'Full-Stack Developer & Designer',
    bio: 'I build modern digital products, portfolio experiences, and backend systems with a strong focus on UX, performance, and maintainability.',
    location: 'India',
    email: 'hello@avalin.dev',
    phone: '+91 98765 43210',
    summary: 'I turn ideas into polished digital experiences.',
    socialLinks: {
      github: 'https://github.com/avalin123prusty',
      linkedin: 'https://www.linkedin.com',
      twitter: 'https://twitter.com'
    }
  },
  skills: [
    { id: 's1', name: 'JavaScript', level: 95 },
    { id: 's2', name: 'React', level: 92 },
    { id: 's3', name: 'Node.js', level: 90 },
    { id: 's4', name: 'Express', level: 88 },
    { id: 's5', name: 'Next.js', level: 91 },
    { id: 's6', name: 'PostgreSQL', level: 82 }
  ],
  projects: [
    {
      id: 'p1',
      title: 'Portfolio Platform',
      description: 'A modern portfolio platform for personal branding and project showcases.',
      image: '',
      stack: ['Next.js', 'Tailwind CSS', 'Express'],
      liveUrl: '',
      githubUrl: '',
      featured: true,
      status: 'published'
    },
    {
      id: 'p2',
      title: 'Custom CMS Dashboard',
      description: 'A custom content system for managing portfolio data, media, and contact messages.',
      image: '',
      stack: ['React', 'Express', 'SQLite'],
      liveUrl: '',
      githubUrl: '',
      featured: true,
      status: 'published'
    }
  ],
  blogs: [
    {
      id: 'b1',
      title: 'Building maintainable frontend systems',
      slug: 'building-maintainable-frontend-systems',
      excerpt: 'Insights on scalable frontend architecture and design systems.',
      content: 'Modern frontend systems require performance, clean structure, and reusable components.',
      date: '2026-09-01',
      readTime: '4 min read',
      status: 'published'
    }
  ],
  experience: [
    {
      id: 'e1',
      company: 'Freelance Studio',
      role: 'Full-Stack Developer',
      period: '2024 - Present',
      description: 'Worked on portfolio sites, SaaS dashboards, and API-driven web apps.'
    }
  ],
  testimonials: [
    {
      id: 't1',
      name: 'A Client',
      role: 'Startup Founder',
      quote: 'The project was delivered with excellent attention to detail, speed, and UX.'
    }
  ],
  services: [
    {
      id: 'sv1',
      title: 'Web Development',
      description: 'Build responsive and scalable web experiences from design to deployment.'
    },
    {
      id: 'sv2',
      title: 'CMS Development',
      description: 'Create custom dashboards and content workflows for product teams.'
    }
  ],
  messages: [],
  media: []
};

function createSchema() {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS about (
      id TEXT PRIMARY KEY CHECK (id = 'about'),
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS refresh_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER
    );
  `);
  for (const collection of collectionNames) {
    database.exec(`CREATE TABLE IF NOT EXISTS ${collection} (id TEXT PRIMARY KEY, payload TEXT NOT NULL);`);
  }
}

function normalizeStore(store) {
  const normalized = { ...defaultStore, ...store };
  normalized.users = (normalized.users || []).map((user) => {
    const { password, ...safeUser } = user;
    return {
      ...safeUser,
      email: String(user.email || env.ADMIN_EMAIL).toLowerCase(),
      passwordHash: user.passwordHash || hashPassword(password || env.ADMIN_PASSWORD),
      role: user.role || 'admin'
    };
  });
  return normalized;
}

function saveStore(store) {
  const normalized = normalizeStore(store);
  database.exec('BEGIN IMMEDIATE');
  try {
    database.prepare('DELETE FROM users').run();
    const insertUser = database.prepare('INSERT INTO users (id, email, password_hash, role, created_at, payload) VALUES (?, ?, ?, ?, ?, ?)');
    for (const user of normalized.users) {
      insertUser.run(user.id, user.email, user.passwordHash, user.role, user.createdAt || new Date().toISOString(), JSON.stringify(user));
    }

    database.prepare("INSERT OR REPLACE INTO about (id, payload) VALUES ('about', ?)").run(JSON.stringify(normalized.about || {}));

    for (const collection of collectionNames) {
      database.prepare(`DELETE FROM ${collection}`).run();
      const insert = database.prepare(`INSERT INTO ${collection} (id, payload) VALUES (?, ?)`);
      for (const item of normalized[collection] || []) {
        if (item.id) {
          insert.run(String(item.id), JSON.stringify(item));
        }
      }
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function ensureStore() {
  if (database) {
    return;
  }
  fs.mkdirSync(dataDir, { recursive: true });
  database = new DatabaseSync(databasePath);
  createSchema();

  const existingCount = database.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (existingCount > 0) {
    return;
  }

  const initialStore = fs.existsSync(legacyStorePath)
    ? normalizeStore(JSON.parse(fs.readFileSync(legacyStorePath, 'utf-8')))
    : defaultStore;
  const adminIndex = initialStore.users.findIndex((user) => user.role === 'admin');
  const configuredAdmin = {
    ...(adminIndex >= 0 ? initialStore.users[adminIndex] : {}),
    id: adminIndex >= 0 ? initialStore.users[adminIndex].id : 'admin-1',
    email: env.ADMIN_EMAIL.toLowerCase(),
    passwordHash: hashPassword(env.ADMIN_PASSWORD),
    role: 'admin'
  };
  if (adminIndex >= 0) {
    initialStore.users[adminIndex] = configuredAdmin;
  } else {
    initialStore.users.unshift(configuredAdmin);
  }
  saveStore(initialStore);
}

export function readStore() {
  ensureStore();
  const store = {
    about: JSON.parse(database.prepare("SELECT payload FROM about WHERE id = 'about'").get()?.payload || '{}'),
    users: database.prepare('SELECT payload FROM users').all().map((row) => JSON.parse(row.payload))
  };
  for (const collection of collectionNames) {
    store[collection] = database.prepare(`SELECT payload FROM ${collection}`).all().map((row) => JSON.parse(row.payload));
  }
  return store;
}

export function writeStore(store) {
  ensureStore();
  saveStore(store);
}

export function verifyPassword(password, passwordHash) {
  if (!password || !passwordHash) {
    return false;
  }
  const [salt, hash] = passwordHash.split(':');
  if (!salt || !hash) {
    return false;
  }
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function createRefreshSession(id, userId, expiresAt) {
  ensureStore();
  database.prepare('DELETE FROM refresh_sessions WHERE expires_at <= ?').run(Date.now());
  database.prepare('INSERT INTO refresh_sessions (id, user_id, expires_at, revoked_at) VALUES (?, ?, ?, NULL)')
    .run(id, userId, expiresAt);
}

export function consumeRefreshSession(id, userId) {
  ensureStore();
  const result = database.prepare('UPDATE refresh_sessions SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > ?')
    .run(Date.now(), id, userId, Date.now());
  return result.changes === 1;
}
