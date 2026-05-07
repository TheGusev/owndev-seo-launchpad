/**
 * PROUpsellBlock — апсель-блок «Site Formula PRO».
 *
 * Используется:
 *  1) Внизу страницы результата обычной формулы (SiteFormulaReport.tsx)
 *     — variant="full" с детальным сравнением Free vs PRO.
 *  2) В виде компактного баннера (variant="compact") на других страницах
 *     при необходимости.
 *
 * Цена не отображается (тестовый период) — вместо неё кнопка
 * «Получить ранний доступ» ведёт на /site-formula/v3 (wizard PRO).
 */
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Check, X, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PROUpsellBlockProps {
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * Что входит в каждый план. Free = текущая Site Formula. PRO = V3.
 * Список нарочно подобран так, чтобы PRO выглядел как естественный
 * upgrade, а не «другой продукт».
 */
const COMPARISON: Array<{
  feature: string;
  free: boolean | string;
  pro: boolean | string;
  highlight?: boolean;
}> = [
  { feature: 'Архитектурный blueprint сайта', free: true, pro: true },
  { feature: '6 слоёв архитектуры (карта спроса, интенты, индексация)', free: true, pro: true },
  { feature: 'Расчёт стоимости разработки', free: true, pro: true },
  { feature: 'Экспорт PDF / Markdown', free: true, pro: true },

  { feature: '23 типа проекта (Tier A/B/C — гео, e-commerce, SaaS, медицина…)', free: false, pro: true, highlight: true },
  { feature: 'Реальный спрос из Wordstat (частоты + кластеры)', free: false, pro: true, highlight: true },
  { feature: 'Технический паспорт: llms.txt + robots для 17 AI-ботов', free: false, pro: true, highlight: true },
  { feature: 'Preflight 4-осей (SEO ≥ 85 / Direct ≥ 90 / Schema = 100 / AI-LLM ≥ 85)', free: false, pro: true, highlight: true },
  { feature: 'Аудит реальных страниц + gap-анализ', free: false, pro: true },
  { feature: 'super_prompt_pack v1 для Lovable / Cursor / v0 / Claude Code', free: false, pro: true, highlight: true },
  { feature: 'ZIP-архив с готовыми спеками для разработки', free: false, pro: true },
];

const KEY_BENEFITS_PRO = [
  'Сайт собирается «под ключ» в Lovable / Cursor / v0 — без ручной адаптации',
  'Гарантированное прохождение Preflight 4-осей: SEO + Direct + Schema + AI-LLM',
  'Реальный спрос из Wordstat вместо догадок — вы знаете, что нужно индексировать',
  'AI-ready по стандарту 2026: llms.txt и schema.org для всех AI-ботов сразу',
];

export default function PROUpsellBlock({ variant = 'full', className = '' }: PROUpsellBlockProps) {
  if (variant === 'compact') {
    return (
      <div
        className={`rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-fuchsia-500/5 to-violet-500/5 p-5 sm:p-6 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
            <Crown className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">Site Formula PRO</h3>
              <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">Beta · Ранний доступ</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Wordstat-данные, Preflight 4-осей и AI-ready пак для Lovable / Cursor — точный
              blueprint вместо общих рекомендаций.
            </p>
          </div>
          <Button asChild size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-fuchsia-500 text-white hover:opacity-90 shrink-0">
            <Link to="/site-formula/v3">
              Получить PRO <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ─── full variant ────────────────────────────────────────────
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.06] via-fuchsia-500/[0.06] to-violet-500/[0.08] p-6 sm:p-8 ${className}`}
      aria-labelledby="pro-upsell-heading"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(45_100%_60%/0.08),transparent_60%)]" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-amber-500/40 text-amber-500 gap-1">
              <Sparkles className="h-3 w-3" /> Beta · Ранний доступ
            </Badge>
            <Badge variant="outline" className="border-fuchsia-500/40 text-fuchsia-400">
              Закрытая продажа
            </Badge>
          </div>
          <h2
            id="pro-upsell-heading"
            className="font-['Playfair_Display'] text-2xl sm:text-3xl font-bold tracking-tight"
          >
            Получите{' '}
            <span className="pro-shimmer-text">
              Site Formula PRO
            </span>{' '}
            — точный blueprint вместо общих рекомендаций
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Бесплатная версия даёт архитектурную базу. PRO добавляет реальный спрос из Wordstat,
            аудит существующих страниц, Preflight по 4 осям и готовый пак для AI-разработчика —
            всё, чего не хватает, чтобы сайт сразу заработал.
          </p>
        </div>

        {/* Key benefits */}
        <div className="grid sm:grid-cols-2 gap-3">
          {KEY_BENEFITS_PRO.map((b) => (
            <div
              key={b}
              className="flex items-start gap-3 rounded-lg border border-amber-500/15 bg-background/40 p-3"
            >
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                <Check className="h-3 w-3" />
              </div>
              <span className="text-sm text-foreground/90">{b}</span>
            </div>
          ))}
        </div>

        {/* Comparison — мобильный вид (карточки sm:hidden) */}
        <div className="sm:hidden space-y-2">
          {COMPARISON.map((row) => (
            <div
              key={row.feature}
              className={`rounded-xl border border-border/60 bg-background/40 p-3 ${
                row.highlight ? 'bg-amber-500/[0.04] border-amber-500/30' : ''
              }`}
            >
              <div className="text-sm text-foreground/90 flex items-start gap-2 mb-2">
                {row.highlight && <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />}
                <span className="font-medium">{row.feature}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-card/40 border border-border/40">
                  <span className="text-muted-foreground uppercase tracking-wide text-[10px] font-medium">Free</span>
                  <span className="ml-auto">
                    {row.free === true ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : row.free === false ? (
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    ) : (
                      <span className="text-muted-foreground">{row.free}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/5 border border-amber-500/30">
                  <span className="text-amber-500 uppercase tracking-wide text-[10px] font-medium">PRO</span>
                  <span className="ml-auto">
                    {row.pro === true ? (
                      <Check className="h-4 w-4 text-amber-500" />
                    ) : row.pro === false ? (
                      <X className="h-4 w-4 text-muted-foreground/50" />
                    ) : (
                      <span className="text-foreground">{row.pro}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table — десктопный вид (sm+) */}
        <div className="hidden sm:block rounded-xl border border-border/60 bg-background/40 overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 border-b border-border/60 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div>Что входит</div>
            <div className="text-center w-24">Free</div>
            <div className="text-center w-24">PRO</div>
          </div>
          <ul className="divide-y divide-border/40">
            {COMPARISON.map((row) => (
              <li
                key={row.feature}
                className={`grid grid-cols-[1fr_auto_auto] gap-3 px-4 py-3 items-center ${
                  row.highlight ? 'bg-amber-500/[0.04]' : ''
                }`}
              >
                <div className="text-sm text-foreground/90 flex items-center gap-2 min-w-0">
                  {row.highlight && <Sparkles className="h-3 w-3 shrink-0 text-amber-500" />}
                  <span className="break-words">{row.feature}</span>
                </div>
                <div className="w-24 flex justify-center">
                  {row.free === true ? (
                    <Check className="h-4 w-4 text-emerald-500" aria-label="входит" />
                  ) : row.free === false ? (
                    <X className="h-4 w-4 text-muted-foreground/50" aria-label="не входит" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{row.free}</span>
                  )}
                </div>
                <div className="w-24 flex justify-center">
                  {row.pro === true ? (
                    <Check className="h-4 w-4 text-amber-500" aria-label="входит" />
                  ) : row.pro === false ? (
                    <X className="h-4 w-4 text-muted-foreground/50" aria-label="не входит" />
                  ) : (
                    <span className="text-xs text-foreground">{row.pro}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <Button
            asChild
            size="lg"
            className="pro-shimmer-overlay gap-2 bg-gradient-to-r from-amber-500 via-fuchsia-500 to-violet-500 text-white hover:opacity-90 shadow-[0_0_30px_hsl(45_100%_60%/0.25)]"
          >
            <Link to="/site-formula/v3">
              <Crown className="h-4 w-4" />
              Получить ранний доступ к PRO
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Beta-период · цена ещё формируется · ранний доступ без ограничений количества генераций
          </p>
        </div>
      </div>
    </section>
  );
}
