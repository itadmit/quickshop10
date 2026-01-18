/**
 * Upstash Integration
 * 
 * Redis: For real-time counters and online users
 * QStash: For async message queue (not blocking main thread)
 */

import { Redis } from '@upstash/redis';
import { Client as QStashClient } from '@upstash/qstash';

// Lazy-initialized Redis client (for counters and online users)
// This prevents errors when env vars are not set
let _redis: Redis | null = null;

export const redis: Redis = new Proxy({} as Redis, {
  get(_, prop) {
    if (!_redis) {
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.');
      }
      _redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    return (_redis as unknown as Record<string | symbol, unknown>)[prop];
  }
});

// Lazy-initialized QStash client (for async message queue)
let _qstash: QStashClient | null = null;

export const qstash: QStashClient = new Proxy({} as QStashClient, {
  get(_, prop) {
    if (!_qstash) {
      if (!process.env.QSTASH_TOKEN) {
        throw new Error('QStash is not configured. Set QSTASH_TOKEN environment variable.');
      }
      _qstash = new QStashClient({
        token: process.env.QSTASH_TOKEN,
      });
    }
    return (_qstash as unknown as Record<string | symbol, unknown>)[prop];
  }
});

// Helper: Get today's date key
export function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// Helper: Get current hour key
export function getHourKey(): string {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}:${now.getHours().toString().padStart(2, '0')}`;
}



