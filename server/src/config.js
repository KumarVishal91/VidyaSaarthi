import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 4000,
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgres://vidya:vidya@localhost:5432/vidyasaarthi',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  staffCode: process.env.STAFF_CODE || 'STAFF-142',
  anthropicKey: process.env.ANTHROPIC_API_KEY || '',
  assistantModel: process.env.ASSISTANT_MODEL || 'claude-sonnet-5-5',
  isProd: process.env.NODE_ENV === 'production',
};

if (config.isProd && config.jwtSecret === 'dev-secret-change-me') {
  throw new Error('Set JWT_SECRET before running in production.');
}
