import { z } from 'zod';

const urlSchema = z.string().url();

export function isValidUrl(input: string): boolean {
  return urlSchema.safeParse(input).success;
}

export function normalizeUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname}${parsed.pathname.replace(/\/+$/, '')}`;
}
