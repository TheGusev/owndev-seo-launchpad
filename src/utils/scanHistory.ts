export interface ScanHistoryItem {
  scanId: string;
  url: string;
  date: string;
  scores?: { total: number; seo: number; direct: number; schema: number; ai: number };
}

const HISTORY_KEY = 'owndev_scan_history';
const MAX_HISTORY = 10;

export const addToHistory = (item: ScanHistoryItem) => {
  const history = getHistory();
  const updated = [item, ...history.filter(h => h.scanId !== item.scanId)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};

export const getHistory = (): ScanHistoryItem[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};
