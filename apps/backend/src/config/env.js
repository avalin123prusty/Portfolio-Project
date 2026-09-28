import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  CMS_URL: process.env.CMS_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'portfolio-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads'
};
