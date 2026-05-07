// Универсальный lead-capture с контекстом.
// Любая кнопка «связаться / получить расчёт / обсудить» вызывает openLead({...})
// и LeadModal в корне App открывается с предзаполненными данными.
//
// В TG улетает структурированное сообщение с source / subject / context_data.

import { useEffect, useState } from 'react';

export type LeadContext = {
  /** Откуда пришёл пользователь, например "Сайт-формула" / "GEO Аудит" / "Marketplace Audit". */
  source: string;
  /** Тема сообщения для TG, например "Точный расчёт стоимости разработки". */
  subject: string;
  /** Заголовок модалки (если не задан — используется subject). */
  title?: string;
  /** Подзаголовок/описание над формой. */
  description?: string;
  /** Текст кнопки submit. */
  ctaLabel?: string;
  /** Произвольные ключ-значение, которые попадут в TG-сообщение. */
  contextData?: Record<string, string | number | undefined | null>;
  /** Заранее заполненный текст в поле «Сообщение». */
  prefillMessage?: string;
};

type Listener = (ctx: LeadContext | null) => void;

const listeners = new Set<Listener>();
let current: LeadContext | null = null;

export function openLead(ctx: LeadContext) {
  current = ctx;
  listeners.forEach((l) => l(current));
}

export function closeLead() {
  current = null;
  listeners.forEach((l) => l(current));
}

export function useLeadCapture(): LeadContext | null {
  const [state, setState] = useState<LeadContext | null>(current);
  useEffect(() => {
    const listener: Listener = (ctx) => setState(ctx);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return state;
}
