import { sql } from '../client.js';
import type { Domain } from '../../types/domain.js';

export async function getOrCreateDomain(userId: string, hostname: string): Promise<Domain> {
  const [domain] = await sql<Domain[]>`
    INSERT INTO domains (user_id, hostname)
    VALUES (${userId}, ${hostname})
    ON CONFLICT (user_id, hostname) DO UPDATE SET hostname = EXCLUDED.hostname
    RETURNING *
  `;
  return domain;
}

export async function getDomainsByUser(userId: string): Promise<Domain[]> {
  return sql<Domain[]>`SELECT * FROM domains WHERE user_id = ${userId} ORDER BY created_at DESC`;
}

export async function getDomainById(id: string): Promise<Domain | null> {
  const [domain] = await sql<Domain[]>`SELECT * FROM domains WHERE id = ${id}`;
  return domain ?? null;
}
