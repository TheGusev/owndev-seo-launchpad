import { getDueMonitors, getMonitorById } from '../db/queries/monitors.js';
import { addMonitorJob } from '../queue/jobs.js';
import { logger } from '../utils/logger.js';

export class MonitorService {
  /** Schedule a single monitor as a delayed BullMQ job */
  async scheduleMonitor(monitorId: string) {
    const monitor = await getMonitorById(monitorId);
    if (!monitor || !monitor.enabled) return;

    const delay = monitor.next_run_at
      ? Math.max(0, new Date(monitor.next_run_at).getTime() - Date.now())
      : 0;

    // Resolve hostname from domain record for the job URL
    const { getDomainById } = await import('../db/queries/domains.js');
    const domain = await getDomainById(monitor.domain_id);
    const resolvedUrl = domain ? `https://${domain.hostname}` : '';

    await addMonitorJob(
      {
        monitorId: monitor.id,
        domainId: monitor.domain_id,
        url: resolvedUrl,
        userId: monitor.user_id,
      },
      delay,
    );

    logger.info('MONITOR', `Scheduled ${monitorId} with delay ${delay}ms`);
  }

  /** Read all due monitors from DB and schedule them */
  async startAll() {
    const monitors = await getDueMonitors();
    logger.info('MONITOR', `Found ${monitors.length} due monitors`);

    for (const m of monitors) {
      await this.scheduleMonitor(m.id);
    }

    logger.info('MONITOR', 'All due monitors scheduled');
  }
}
