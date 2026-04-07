import { pool } from '../client.js';
import type { User } from '../../types/user.js';

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getUserByApiKey(apiKey: string): Promise<User | null> {
  const { rows } = await pool.query(`SELECT * FROM users WHERE api_key = $1`, [apiKey]);
  return rows[0] ?? null;
}
