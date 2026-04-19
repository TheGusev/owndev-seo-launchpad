import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { ParsedProduct, MarketplaceIssue } from '../../../types/marketplaceAudit.js';

interface RuleCfg {
  id: string;
  module: MarketplaceIssue['module'];
  severity: MarketplaceIssue['severity'];
  impact_score: number;
  title: string;
  check: string;
  threshold?: number;
  why_it_matters: string;
  how_to_fix: string;
  example_fix?: string;
  visible_in_preview: boolean;
}

let CACHED: { version: string; rules: RuleCfg[] } | null = null;

export function loadRulesConfig(): { version: string; rules: RuleCfg[] } {
  if (CACHED) return CACHED;
  const p = resolve(process.cwd(), 'config/marketplace-rules.v1.json');
  const raw = readFileSync(p, 'utf-8');
  CACHED = JSON.parse(raw);
  return CACHED!;
}

const FORBIDDEN = ['лучший', 'лучшая', 'лучшее', '№1', 'номер 1', 'идеальный', 'идеальная', '100%', 'гарантированно'];

function evaluateCheck(
  rule: RuleCfg,
  product: ParsedProduct,
  ctx: { coveragePct: number; categoryRootInTitle: boolean },
): { triggered: boolean; found: string } | null {
  const title = product.title || '';
  const desc = product.description || '';
  switch (rule.check) {
    case 'title_min_length': {
      if (title.length < (rule.threshold ?? 40)) return { triggered: true, found: `Title ${title.length} симв` };
      return { triggered: false, found: '' };
    }
    case 'title_max_length': {
      if (title.length > (rule.threshold ?? 120)) return { triggered: true, found: `Title ${title.length} симв` };
      return { triggered: false, found: '' };
    }
    case 'description_min_length': {
      if (desc.length < (rule.threshold ?? 300)) return { triggered: true, found: `Описание ${desc.length} симв` };
      return { triggered: false, found: '' };
    }
    case 'images_min_count': {
      if (product.images.length < (rule.threshold ?? 3)) return { triggered: true, found: `${product.images.length} фото` };
      return { triggered: false, found: '' };
    }
    case 'images_optimal_count': {
      const min = rule.threshold ?? 7;
      if (product.images.length >= 3 && product.images.length < min) return { triggered: true, found: `${product.images.length} фото` };
      return { triggered: false, found: '' };
    }
    case 'attributes_min_count': {
      const n = Object.keys(product.attributes ?? {}).length;
      if (n < (rule.threshold ?? 8)) return { triggered: true, found: `${n} характеристик` };
      return { triggered: false, found: '' };
    }
    case 'title_contains_category': {
      if (!ctx.categoryRootInTitle) return { triggered: true, found: `Категория: «${product.category}» не найдена в title` };
      return { triggered: false, found: '' };
    }
    case 'keywords_coverage': {
      if (ctx.coveragePct < (rule.threshold ?? 30)) return { triggered: true, found: `Покрытие ${ctx.coveragePct}%` };
      return { triggered: false, found: '' };
    }
    case 'synonyms_present': {
      const stems = new Set<string>();
      for (const w of (desc.toLowerCase().split(/\s+/))) {
        const s = w.replace(/[^а-яёa-z]/gi, '').slice(0, 5);
        if (s.length >= 4) stems.add(s);
      }
      if (stems.size < 15) return { triggered: true, found: `Уникальных основ слов: ${stems.size}` };
      return { triggered: false, found: '' };
    }
    case 'title_duplicates': {
      const words = title.toLowerCase().replace(/[^\wа-яё\s]/gi, '').split(/\s+/).filter((w) => w.length > 3);
      const seen = new Set<string>();
      for (const w of words) {
        if (seen.has(w)) return { triggered: true, found: `Повтор слова: «${w}»` };
        seen.add(w);
      }
      return { triggered: false, found: '' };
    }
    case 'forbidden_words': {
      const low = `${title} ${desc}`.toLowerCase();
      const found = FORBIDDEN.filter((w) => low.includes(w));
      if (found.length > 0) return { triggered: true, found: `Найдены: ${found.join(', ')}` };
      return { triggered: false, found: '' };
    }
    case 'video_present': {
      if (!product.videoCount || product.videoCount === 0) return { triggered: true, found: 'Видео не найдено' };
      return { triggered: false, found: '' };
    }
    case 'description_structured': {
      const structured = /\n\s*\n/.test(desc) || /[•\-—]\s/.test(desc);
      if (!structured && desc.length > 200) return { triggered: true, found: 'Описание без абзацев и списков' };
      return { triggered: false, found: '' };
    }
    default:
      return null;
  }
}

export function runRuleEngine(
  product: ParsedProduct,
  ctx: { coveragePct: number },
): MarketplaceIssue[] {
  const cfg = loadRulesConfig();
  const catRoot = (product.category || '').toLowerCase().split(/[\s,/]/).find((w) => w.length > 3) || '';
  const categoryRootInTitle = catRoot ? product.title.toLowerCase().includes(catRoot) : false;

  const issues: MarketplaceIssue[] = [];
  for (const rule of cfg.rules) {
    const res = evaluateCheck(rule, product, { ...ctx, categoryRootInTitle });
    if (res?.triggered) {
      issues.push({
        id: rule.id,
        module: rule.module,
        severity: rule.severity,
        title: rule.title,
        found: res.found,
        why_it_matters: rule.why_it_matters,
        how_to_fix: rule.how_to_fix,
        example_fix: rule.example_fix,
        impact_score: rule.impact_score,
        visible_in_preview: rule.visible_in_preview,
        source: 'rule',
      });
    }
  }
  return issues;
}

export function getRulesVersion(): string {
  return loadRulesConfig().version;
}
