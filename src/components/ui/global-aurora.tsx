/**
 * GlobalAurora — фиксированный aurora-фон на body.
 *
 * Активируется только в светлой теме (`html.light`) — три радиальных
 * пятна (primary / secondary / accent) дают тот же насыщенный baseline,
 * что и страница /site-formula, но на каждой странице сайта.
 *
 * В тёмной теме компонент не рендерит ничего: тёмный premium-градиент
 * (PR-13) живёт самостоятельно через переменные :root.
 *
 * Реализация:
 *  - position: fixed; inset: 0; pointer-events: none — нулевой CLS.
 *  - z-index: 0 — ниже контента (#root z-стек начинается с 1+).
 *  - prefers-reduced-motion: статичные пятна без drift-анимации
 *    (animation выставляется через .aurora-N классы в index.css).
 */

import { useEffect, useState } from "react";

export const GlobalAurora = () => {
  const [isLight, setIsLight] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("light");
  });

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsLight(root.classList.contains("light"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  if (!isLight) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0, contain: "layout paint" }}
    >
      {/* Тёплое пятно primary в верхнем левом углу */}
      <div
        className="aurora-layer aurora-1"
        style={{
          top: "-20%",
          left: "-15%",
          width: "70vw",
          height: "70vw",
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, transparent 65%)",
        }}
      />
      {/* Холодное secondary справа сверху */}
      <div
        className="aurora-layer aurora-2"
        style={{
          top: "5%",
          right: "-20%",
          width: "60vw",
          height: "60vw",
          background:
            "radial-gradient(circle, hsl(var(--secondary) / 0.14) 0%, transparent 65%)",
        }}
      />
      {/* Accent снизу — тянется через всю страницу */}
      <div
        className="aurora-layer aurora-3"
        style={{
          bottom: "-25%",
          left: "10%",
          width: "75vw",
          height: "75vw",
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)",
        }}
      />
    </div>
  );
};

export default GlobalAurora;
