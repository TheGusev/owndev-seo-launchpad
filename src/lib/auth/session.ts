/**
 * Заглушка сессии пользователя.
 * TODO: заменить на реальную авторизацию (Supabase Auth / собственный backend).
 */

export type Plan = 'free' | 'solo' | 'pro' | 'agency';

export interface AppUser {
  id: string;
  plan: Plan;
}

/**
 * Получить текущего пользователя.
 * Пока всегда null — авторизации нет.
 */
export function getCurrentUser(): AppUser | null {
  // TODO: заменить на реальную проверку сессии
  return null;
}

/**
 * Проверить, доступна ли фича текущему пользователю.
 * Пока всегда true — ограничений нет.
 */
export function canAccess(_feature: string): boolean {
  // TODO: реализовать проверку лимитов по тарифу
  // const user = getCurrentUser();
  // if (!user) return false;
  // return planLimits[user.plan].includes(feature);
  return true;
}
