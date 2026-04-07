export type DomainStatus = 'active' | 'monitoring' | 'archived';

export interface Domain {
  id: string;
  url: string;
  status: DomainStatus;
  last_audit_at: string | null;
  created_at: string;
}
