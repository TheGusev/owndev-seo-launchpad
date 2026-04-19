export type Plan = 'anon' | 'free' | 'solo' | 'pro' | 'agency';

export interface User {
  id: string;
  email: string;
  plan: Plan;
  api_key: string;
  credits_used: number;
  credits_limit: number;
  created_at: string;
}
