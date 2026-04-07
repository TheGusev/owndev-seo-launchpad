export type Plan = 'free' | 'solo' | 'pro' | 'agency';

export interface User {
  id: string;
  email: string;
  plan: Plan;
  api_key: string;
  created_at: string;
}
