/**
 * Upstash Integration
 * 
 * Redis: For real-time counters and online users
 * QStash: For async message queue (not blocking main thread)
 */

import { Redis } from '@upstash/redis';
import { Client as QStashClient } from '@upstash/qstash';

// Redis client (for counters and online users)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// QStash client (for async message queue)
export const qstash = new QStashClient({
  token: process.env.QSTASH_TOKEN!,
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



