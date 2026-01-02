import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon Serverless - optimized for Vercel/Edge
// Uses HTTP protocol - no connection overhead!
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

// For testing connection speed
export async function testConnection() {
  const start = performance.now();
  const result = await sql`SELECT 1 as connected`;
  const end = performance.now();
  return {
    connected: result[0]?.connected === 1,
    latency: Math.round(end - start),
  };
}

