export interface Monitor {
  id: string;
  domain_id: string;
  user_id: string;
  period: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}
