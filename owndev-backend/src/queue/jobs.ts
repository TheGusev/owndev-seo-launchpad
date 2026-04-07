import { auditQueue, monitorQueue } from './queues.js';

export interface AuditJobData {
  auditId: string;
  domainId: string;
  url: string;
  userId: string | null;
}

export interface MonitorJobData {
  domainId: string;
  url: string;
}

export async function addAuditJob(data: AuditJobData) {
  return auditQueue.add('run-audit', data, {
    attempts: 2,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export async function addMonitorJob(data: MonitorJobData) {
  return monitorQueue.add('run-monitor', data, {
    attempts: 1,
  });
}
