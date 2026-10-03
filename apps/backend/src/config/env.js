import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  CMS_URL: process.env.CMS_URL || 'http://localhost:5173',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
  JWT_SECRET: process.env.JWT_SECRET || 'local-development-secret-change-before-deploy',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'local-refresh-secret-change-before-deploy',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@portfolio.local',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  PUBLIC_API_URL: (process.env.PUBLIC_API_URL || '').replace(/\/$/, ''),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CONTACT_RATE_LIMIT: Number(process.env.CONTACT_RATE_LIMIT) || 5,
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
  SMTP_FROM: process.env.SMTP_FROM || '',
  CONTACT_TO: process.env.CONTACT_TO || process.env.ADMIN_EMAIL || 'admin@portfolio.local'
};

if (env.NODE_ENV === 'production') {
  const placeholderPattern = /local-|replace_|use_a_different|change_this|placeholder/i;
  if (env.JWT_SECRET.length < 32 || env.REFRESH_TOKEN_SECRET.length < 32 || placeholderPattern.test(env.JWT_SECRET) || placeholderPattern.test(env.REFRESH_TOKEN_SECRET)) {
    throw new Error('Set unique JWT_SECRET and REFRESH_TOKEN_SECRET values with at least 32 characters in production.');
  }
  if (env.ADMIN_PASSWORD.length < 12 || placeholderPattern.test(env.ADMIN_PASSWORD)) {
    throw new Error('Set ADMIN_PASSWORD to a unique value with at least 12 characters in production.');
  }
}
