import { useState, useCallback } from "react";

function getHostname(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return url.replace(/[^a-zA-Z0-9.-]/g, "_");
  }
}

function getStorageKey(url: string) {
  return `owndev_fixes_${getHostname(url)}`;
}

export function useIssueTracker(url: string) {
  const key = getStorageKey(url);

  const [resolvedIds, setResolvedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  });

  const toggleIssue = useCallback(
    (id: string) => {
      setResolvedIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    },
    [key]
  );

  const resetFixes = useCallback(() => {
    localStorage.removeItem(key);
    setResolvedIds([]);
  }, [key]);

  return {
    resolvedIds,
    toggleIssue,
    resetFixes,
    resolvedCount: resolvedIds.length,
  };
}
