import { sql } from '../client.js';

export async function logEvent(
  name: string,
  payload?: Record<string, unknown>,
  userId?: string | null,
): Promise<void> {
  await sql`
    INSERT INTO events (user_id, name, payload)
    VALUES (${userId ?? null}, ${name}, ${payload ? sql.json(payload) : null})
  `;
}
