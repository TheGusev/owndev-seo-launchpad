import cron from 'node-cron';
import { pool } from '../db/client.js';
import { addMonitorJob } from '../queue/jobs.js';
import { logger } from '../utils/logger.js';

export class MonitorService {
  /**
   * Запускает cron-задачу: каждые 6 часов проверять все домены со статусом 'monitoring'.
   */
  start() {
    cron.schedule('0 */6 * * *', async () => {
      logger.info('MONITOR', 'Running scheduled domain check');

      try {
        const { rows } = await pool.query(
          `SELECT id, url FROM domains WHERE status = 'monitoring'`,
        );

        for (const domain of rows) {
          await addMonitorJob({ domainId: domain.id, url: domain.url });
        }

        logger.info('MONITOR', `Queued ${rows.length} domains for check`);
      } catch (err: any) {
        logger.error('MONITOR', 'Cron error:', err.message);
      }
    });

    logger.info('MONITOR', 'Cron scheduler started (every 6h)');
  }
}
