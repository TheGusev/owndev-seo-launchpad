import { sql } from '../client.js';
import type { User } from '../../types/user.js';

export async function getUserById(id: string): Promise<User | null> {
  const [user] = await sql<User[]>`SELECT * FROM users WHERE id = ${id}`;
  return user ?? null;
}

export async function getUserByApiKey(apiKey: string): Promise<User | null> {
  const [user] = await sql<User[]>`SELECT * FROM users WHERE api_key = ${apiKey}`;
  return user ?? null;
}

export async function incrementUserCredits(userId: string): Promise<void> {
  await sql`UPDATE users SET credits_used = credits_used + 1 WHERE id = ${userId}`;
}

export async function checkUserCredits(userId: string): Promise<boolean> {
  const [row] = await sql<{ ok: boolean }[]>`
    SELECT credits_used < credits_limit AS ok FROM users WHERE id = ${userId}
  `;
  return row?.ok ?? false;
}
