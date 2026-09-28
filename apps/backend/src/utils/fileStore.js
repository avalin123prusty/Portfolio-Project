import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../../data');
const storeFile = path.join(dataDir, 'store.json');

const defaultStore = {
  users: [
    {
      id: 'admin-1',
      name: 'Portfolio Admin',
      email: 'admin@portfolio.local',
      password: 'admin123',
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
      image: '/images/project-portfolio.jpg',
      stack: ['Next.js', 'Tailwind CSS', 'Express'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com'
    },
    {
      id: 'p2',
      title: 'CMS Dashboard',
      description: 'A custom CMS for managing content, media, and contact messages with JWT auth.',
      image: '/images/project-cms.jpg',
      stack: ['React', 'Express', 'JWT'],
      liveUrl: 'https://example.com',
      githubUrl: 'https://github.com'
    }
  ],
  blogs: [
    {
      id: 'b1',
      title: 'Building maintainable frontend systems',
      excerpt: 'Insights on scalable frontend architecture and design systems.',
      content: 'Modern frontend systems require performance, clean structure, and reusable components.',
      date: '2026-09-01',
      readTime: '4 min read'
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
      id: 's1',
      title: 'Web Development',
      description: 'Build responsive and scalable web experiences from design to deployment.'
    },
    {
      id: 's2',
      title: 'CMS Development',
      description: 'Create custom dashboards and content workflows for product teams.'
    }
  ],
  messages: [],
  media: []
};

export function ensureStore() {
  fs.mkdirSync(dataDir, { recursive: true });

  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(defaultStore, null, 2));
  }
}

export function readStore() {
  ensureStore();
  const raw = fs.readFileSync(storeFile, 'utf-8');
  return JSON.parse(raw);
}

export function writeStore(data) {
  ensureStore();
  fs.writeFileSync(storeFile, JSON.stringify(data, null, 2));
}
