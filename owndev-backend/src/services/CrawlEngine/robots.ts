/**
 * Minimal robots.txt parser — User-agent + Allow/Disallow.
 * Не реализуем wildcards * и $ полностью — только prefix-match,
 * этого достаточно для уважительного crawl своего сайта.
 */
export interface RobotsRules {
  disallow: string[];
  allow: string[];
  crawlDelayMs: number;
}

const EMPTY: RobotsRules = { disallow: [], allow: [], crawlDelayMs: 0 };

export function parseRobotsTxt(text: string, ua = 'OwndevBot'): RobotsRules {
  if (!text) return EMPTY;
  const lines = text.split(/\r?\n/);
  const groups: { uas: string[]; rules: { type: string; value: string }[] }[] = [];
  let cur: (typeof groups)[number] | null = null;

  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = line.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();

    if (key === 'user-agent') {
      if (!cur || cur.rules.length > 0) {
        cur = { uas: [value.toLowerCase()], rules: [] };
        groups.push(cur);
      } else {
        cur.uas.push(value.toLowerCase());
      }
    } else if (cur && (key === 'disallow' || key === 'allow' || key === 'crawl-delay')) {
      cur.rules.push({ type: key, value });
    }
  }

  // Pick best matching group: explicit ua, then '*'
  const lcUA = ua.toLowerCase();
  const explicit = groups.find((g) => g.uas.some((u) => lcUA.includes(u) && u !== '*'));
  const star = groups.find((g) => g.uas.includes('*'));
  const chosen = explicit || star;
  if (!chosen) return EMPTY;

  const out: RobotsRules = { disallow: [], allow: [], crawlDelayMs: 0 };
  for (const r of chosen.rules) {
    if (r.type === 'disallow' && r.value) out.disallow.push(r.value);
    else if (r.type === 'allow' && r.value) out.allow.push(r.value);
    else if (r.type === 'crawl-delay') {
      const n = Number(r.value);
      if (!Number.isNaN(n)) out.crawlDelayMs = Math.max(0, n * 1000);
    }
  }
  return out;
}

export function isAllowed(rules: RobotsRules, pathname: string): boolean {
  // Самое длинное совпадение allow vs disallow.
  let bestAllow = -1;
  let bestDeny = -1;
  for (const a of rules.allow) {
    if (pathname.startsWith(a) && a.length > bestAllow) bestAllow = a.length;
  }
  for (const d of rules.disallow) {
    if (d && pathname.startsWith(d) && d.length > bestDeny) bestDeny = d.length;
  }
  if (bestDeny < 0) return true;
  return bestAllow >= bestDeny;
}
