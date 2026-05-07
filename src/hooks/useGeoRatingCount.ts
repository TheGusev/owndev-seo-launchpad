// Sprint 9 — динамический счётчик сайтов в GEO-рейтинге для Hero и других мест.
// Бэк: GET /api/v1/site-check/geo-rating/count → { count: number }
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api/config";

const FALLBACK = 132;

export function useGeoRatingCount(initial: number = FALLBACK): number {
  const [count, setCount] = useState<number>(initial);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    fetch(apiUrl("/site-check/geo-rating/count"), {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        const n = Number(d?.count);
        if (Number.isFinite(n) && n > 0) setCount(n);
      })
      .catch(() => {
        // тихо — оставляем initial
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, []);

  return count;
}
