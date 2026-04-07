export interface AppEvent {
  id: number;
  user_id: string | null;
  name: string;
  payload: Record<string, unknown> | null;
  created_at: string;
}
