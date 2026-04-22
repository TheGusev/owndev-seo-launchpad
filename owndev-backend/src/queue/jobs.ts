import { monitorQueue } from './queues.js';

export interface MonitorJobData {
  monitorId: string;
  domainId: string;
  url: string;
  userId?: string;
}

export async function addMonitorJob(data: MonitorJobData, delay?: number) {
  return monitorQueue.add('run-monitor', data, {
    ...(delay != null && delay > 0 ? { delay } : {}),
  });
}
