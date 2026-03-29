import { useState, useCallback } from "react";

const STORAGE_PREFIX = "owndev_fixes_";

function getHostname(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}

function getKey(url: string) {
  return STORAGE_PREFIX + getHostname(url);
}

function loadResolved(url: string): Set<string> {
  try {
    const raw = localStorage.getItem(getKey(url));
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveResolved(url: string, ids: Set<string>) {
  localStorage.setItem(getKey(url), JSON.stringify([...ids]));
}

export function useIssueTracker(url: string) {
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(() => loadResolved(url));

  const toggleIssue = useCallback((id: string) => {
    setResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveResolved(url, next);
      return next;
    });
  }, [url]);

  const resetFixes = useCallback(() => {
    localStorage.removeItem(getKey(url));
    setResolvedIds(new Set());
  }, [url]);

  return {
    resolvedIds: [...resolvedIds],
    isResolved: (id: string) => resolvedIds.has(id),
    toggleIssue,
    resetFixes,
    resolvedCount: resolvedIds.size,
  };
}
