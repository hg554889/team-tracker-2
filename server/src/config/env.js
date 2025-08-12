import 'dotenv/config';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_URLS: (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',').map(s => s.trim()).filter(Boolean),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? 20),
};

if (!env.MONGODB_URI || !env.JWT_SECRET) {
  console.error('[ENV] Missing MONGODB_URI or JWT_SECRET');
  process.exit(1);
}