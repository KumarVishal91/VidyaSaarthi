import Redis from 'ioredis';
import { config } from './config.js';

// Redis is a speed-up, not a requirement. If it is down, every call falls through to the database.
const redis = new Redis(config.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false });
let ready = false;
redis.on('error', () => {});
redis.on('end', () => { ready = false; });
redis.connect().then(() => { ready = true; }).catch(() => {
  console.warn('Redis is not reachable. Caching is off.');
});

export async function cached(key, ttlSeconds, compute) {
  if (ready) {
    try {
      const hit = await redis.get(key);
      if (hit) return JSON.parse(hit);
    } catch { /* fall through */ }
  }
  const value = await compute();
  if (ready) {
    try { await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds); } catch { /* ignore */ }
  }
  return value;
}

export async function bust(...keys) {
  if (!ready) return;
  try { await redis.del(...keys); } catch { /* ignore */ }
}
