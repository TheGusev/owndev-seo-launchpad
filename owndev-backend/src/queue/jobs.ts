import { auditQueue, monitorQueue } from './queues.js';

export interface AuditJobData {
  auditId: string;
  domainId: string;
  url: string;
  userId: string | null;
  toolId?: string;
}

export interface MonitorJobData {
  monitorId: string;
  domainId: string;
  url: string;
  userId?: string;
}

export async function addAuditJob(data: AuditJobData) {
  return auditQueue.add('run-audit', data);
}

export async function addMonitorJob(data: MonitorJobData, delay?: number) {
  return monitorQueue.add('run-monitor', data, {
    ...(delay != null && delay > 0 ? { delay } : {}),
  });
}
