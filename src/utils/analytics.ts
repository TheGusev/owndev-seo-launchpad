const YM_COUNTER_ID = 108194492;

declare global {
  interface Window {
    ym?: (counterId: number, method: string, ...args: unknown[]) => void;
  }
}

export function ymGoal(goal: string) {
  if (typeof window !== "undefined" && window.ym && YM_COUNTER_ID) {
    window.ym(YM_COUNTER_ID, "reachGoal", goal);
  }
}

export function ymHit(url: string) {
  if (typeof window !== "undefined" && window.ym && YM_COUNTER_ID) {
    window.ym(YM_COUNTER_ID, "hit", url);
  }
}
