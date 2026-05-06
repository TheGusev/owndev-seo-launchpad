import 'dotenv/config';
import { startServer } from './api/server.js';
import { redis } from './cache/redis.js';
import { sql, testConnection } from './db/client.js';
import { startMonitorWorker } from './workers/MonitorWorker.js';
import { startSiteCheckWorker } from './workers/SiteCheckWorker.js';
import { startMarketplaceAuditWorker } from './workers/MarketplaceAuditWorker.js';
import { startAllFormulaV2Workers } from './workers/FormulaV2Worker.js';
import { MonitorService } from './services/MonitorService.js';
import { logger } from './utils/logger.js';

async function main() {

  // Test Postgres
  const pgOk = await testConnection();
  if (!pgOk) {
    logger.error('BOOT', 'PostgreSQL connection failed');
    process.exit(1);
  }
  logger.info('BOOT', 'PostgreSQL connected');

  // Start HTTP server
  const server = await startServer();

  // Start workers
  const monitorWorker = startMonitorWorker();
  const siteCheckWorker = startSiteCheckWorker();
  const marketplaceAuditWorker = startMarketplaceAuditWorker();
  const formulaV2Workers = process.env.FORMULA_V2_WORKERS_DISABLED === '1'
    ? []
    : startAllFormulaV2Workers();
  if (formulaV2Workers.length) {
    logger.info('BOOT', `Started ${formulaV2Workers.length} Formula v2 workers`);
  }

  // Schedule all due monitors via BullMQ delayed jobs
  const monitorService = new MonitorService();
  await monitorService.startAll();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info('BOOT', `${signal} received, shutting down...`);
    await server.close();
    await monitorWorker.close();
    await siteCheckWorker.close();
    await marketplaceAuditWorker.close();
    await Promise.all(formulaV2Workers.map((w) => w.close()));
    await redis.quit();
    await sql.end();
    logger.info('BOOT', 'Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error('BOOT', 'Fatal error:', err);
  process.exit(1);
});
