import postgres from 'postgres';
import { logger } from '../utils/logger.js';

export const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});

export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (err: any) {
    logger.error('DB', 'Connection test failed:', err.message);
    return false;
  }
}
