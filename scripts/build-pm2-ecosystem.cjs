#!/usr/bin/env node
/**
 * Builds /var/www/owndev.ru/ecosystem.config.cjs for PM2 from .env files.
 *
 * Why: the previous inline `node -e` in .github/workflows/deploy.yml only
 * looked at /var/www/owndev.ru/.env, but on this project the canonical
 * location of the production .env (with OPENAI_API_KEY, DATABASE_URL,
 * REDIS_URL etc) is /var/www/owndev.ru/owndev-backend/.env. As a result
 * PM2 was started without OPENAI_API_KEY, and every endpoint that relies
 * on it (/llm-judge, /ai-boost, GEO Rating AI score, conversionAudit LLM
 * polish, MarketplaceAudit LLM) silently degraded — which produced the
 * three-different-AI-scores symptom on the GEO Rating screens.
 *
 * This script:
 *   1. Reads .env files in layered order (root first, backend second so
 *      backend wins on conflict).
 *   2. Writes ecosystem.config.cjs in CWD with the merged env.
 *   3. Fails the deploy (exit code 1) if OPENAI_API_KEY is missing, so
 *      we never again ship a PM2 process without the key.
 *
 * CWD is expected to be /var/www/owndev.ru when invoked from deploy.yml.
 */

const fs = require('fs');
const path = require('path');

const candidates = [
  '/var/www/owndev.ru/.env',
  '/var/www/owndev.ru/owndev-backend/.env',
];

const env = {};
const loadedFrom = [];

for (const p of candidates) {
  if (!fs.existsSync(p)) continue;
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[m[1].trim()] = val;
  }
  loadedFrom.push(p);
}

if (loadedFrom.length === 0) {
  console.log('WARNING: no .env found in', candidates.join(', '));
} else {
  console.log('Loaded env from:', loadedFrom.join(', '));
}

const config = {
  apps: [
    {
      name: 'owndev-backend',
      script: 'dist/index.js',
      cwd: '/var/www/owndev.ru/owndev-backend',
      instances: 1,
      autorestart: true,
      env,
    },
  ],
};

const outPath = path.join(process.cwd(), 'ecosystem.config.cjs');
fs.writeFileSync(outPath, 'module.exports=' + JSON.stringify(config, null, 2));

const have = (k) => Object.prototype.hasOwnProperty.call(env, k) && env[k] !== '';

console.log(
  'Ecosystem written to', outPath,
  '| keys:', Object.keys(env).length,
  '| OPENAI_API_KEY:', have('OPENAI_API_KEY'),
  '| DATABASE_URL:', have('DATABASE_URL'),
  '| REDIS_URL:', have('REDIS_URL'),
);

if (!have('OPENAI_API_KEY')) {
  console.error(
    'FATAL: OPENAI_API_KEY missing in PM2 env. ' +
    '/llm-judge, /ai-boost and GEO Rating AI score will fail. ' +
    'Add OPENAI_API_KEY to /var/www/owndev.ru/owndev-backend/.env on the server.',
  );
  process.exit(1);
}
