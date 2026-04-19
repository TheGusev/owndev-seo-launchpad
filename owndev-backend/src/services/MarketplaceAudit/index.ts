import type {
  ParsedProduct,
  ManualInput,
  MarketplacePlatform,
  MarketplaceInputType,
  ScoresJson,
  MarketplaceIssue,
  KeywordsBlock,
  CompetitorBlock,
  CompetitorGapBlock,
  CompetitorsField,
  RecommendationsBlock,
} from '../../types/marketplaceAudit.js';
import { parseWb } from './parsers/wbParser.js';
import { parseOzon } from './parsers/ozonParser.js';
import { normalizeManual } from './parsers/manualNormalizer.js';
import { calcContentScore } from './scoring/contentScore.js';
import { calcSearchScore } from './scoring/searchScore.js';
import { calcConversionScore } from './scoring/conversionScore.js';
import { calcAdReadinessScore } from './scoring/adReadinessScore.js';
import { calcTotalScore } from './scoring/totalScore.js';
import { runRuleEngine, getRulesVersion } from './scoring/ruleEngine.js';
import { callJsonLlm } from './llm/runLlm.js';
import {
  buildContentAuditMessages,
  CONTENT_AUDIT_TOOL,
  buildRewriteMessages,
  REWRITE_TOOL,
  buildKeywordFitMessages,
  KEYWORD_FIT_TOOL,
  buildCompetitorGapMessages,
  COMPETITOR_GAP_TOOL,
} from './llm/prompts.js';
import { buildManualCompetitors } from './competitorService.js';
import { logger } from '../../utils/logger.js';

export interface OrchestratorInput {
  platform: MarketplacePlatform;
  inputType: MarketplaceInputType;
  value: string;
  manual?: ManualInput;
}

export interface OrchestratorResult {
  product: ParsedProduct;
  scores: ScoresJson;
  issues: MarketplaceIssue[];
  keywords: KeywordsBlock;
  competitors: CompetitorsField;
  recommendations: RecommendationsBlock;
  ai_summary: string;
  rules_version: string;
}

async function parseInput(input: OrchestratorInput): Promise<ParsedProduct> {
  if (input.inputType === 'manual') {
    if (!input.manual) throw new Error('Для ручного режима нужны поля title/description/category');
    return normalizeManual(input.platform, input.manual);
  }
  if (input.platform === 'wb') return parseWb(input.value);
  if (input.platform === 'ozon') return parseOzon(input.value);
  throw new Error(`Неизвестная платформа: ${input.platform}`);
}

function summarize(scores: ScoresJson, issuesCount: number): string {
  if (scores.total >= 80) return `Карточка сильная (${scores.total}/100). Найдено ${issuesCount} точек роста — небольшие правки усилят результат.`;
  if (scores.total >= 60) return `Карточка средняя (${scores.total}/100). Есть ${issuesCount} проблем, исправление топ-3 даст быстрый прирост.`;
  if (scores.total >= 40) return `Карточка слабая (${scores.total}/100). ${issuesCount} проблем мешают росту — нужен серьёзный апгрейд.`;
  return `Карточка не готова к продажам (${scores.total}/100). Критичные проблемы: ${issuesCount}. Рекомендуем переработать с нуля.`;
}

function fallbackRewrite(p: ParsedProduct, missing: string[]): RecommendationsBlock {
  const cat = p.category && p.category !== 'Не определена' ? p.category : '';
  const newTitle = p.title.length < 60
    ? [cat, p.title].filter(Boolean).join(' — ').slice(0, 100)
    : p.title.slice(0, 100);
  return {
    newTitle,
    newDescription: p.description || 'Опишите ключевые преимущества, материал, размеры и сценарии использования.',
    bullets: ['Расскажите о выгодах', 'Укажите состав/материал', 'Добавьте размеры и габариты', 'Опишите сценарий использования'],
    addKeywords: missing.slice(0, 8),
    removeWords: [],
  };
}

export async function runMarketplaceAudit(
  input: OrchestratorInput,
  apiKey: string,
  onProgress?: (status: 'parsing' | 'scoring' | 'llm', pct: number) => Promise<void>,
): Promise<OrchestratorResult> {
  await onProgress?.('parsing', 15);
  const product = await parseInput(input);

  await onProgress?.('scoring', 50);
  const content = calcContentScore(product);
  const search = calcSearchScore(product);
  const conversion = calcConversionScore(product);
  const ads = calcAdReadinessScore(product);
  const scores = calcTotalScore({ content, search: search.sub, conversion, ads });
  let issues = runRuleEngine(product, { coveragePct: search.coveragePct });

  let keywords: KeywordsBlock = {
    covered: search.covered,
    missing: search.missing,
    coveragePct: search.coveragePct,
    source: 'naive',
  };
  const competitorList: CompetitorBlock[] = buildManualCompetitors(input.manual?.competitorUrls);
  let competitorGap: CompetitorGapBlock | null = null;

  // ─── LLM enrichment (best-effort, parallel) ───
  await onProgress?.('llm', 70);

  // Run content_audit + keyword_fit + (optionally) competitor_gap in parallel
  const competitorUrls = input.manual?.competitorUrls?.filter(Boolean) ?? [];

  const [contentAuditRes, keywordFitRes, competitorGapRes] = await Promise.allSettled([
    callJsonLlm<{ issues: any[]; strengths: string[] }>({
      messages: buildContentAuditMessages(product),
      tool: CONTENT_AUDIT_TOOL,
      toolName: 'submit_content_audit',
      apiKey,
    }),
    callJsonLlm<{
      covered: string[];
      missing: string[];
      coveragePct: number;
      suggestedKeywords: string[];
    }>({
      messages: buildKeywordFitMessages(product),
      tool: KEYWORD_FIT_TOOL,
      toolName: 'submit_keyword_fit',
      apiKey,
    }),
    competitorUrls.length > 0
      ? callJsonLlm<{
          weakerThan: { aspect: string; evidence: string }[];
          strongerThan: { aspect: string; evidence: string }[];
          priorityAdds: string[];
        }>({
          messages: buildCompetitorGapMessages(product, competitorUrls),
          tool: COMPETITOR_GAP_TOOL,
          toolName: 'submit_competitor_gap',
          apiKey,
        })
      : Promise.resolve(null),
  ]);

  // content audit issues
  if (contentAuditRes.status === 'fulfilled' && contentAuditRes.value?.issues?.length) {
    const llmIssues: MarketplaceIssue[] = contentAuditRes.value.issues.map((it: any, idx: number) => ({
      id: `MA-LLM-${String(idx + 1).padStart(3, '0')}`,
      module: it.module ?? 'content',
      severity: it.severity ?? 'medium',
      title: String(it.title ?? 'AI-замечание'),
      found: String(it.found ?? ''),
      why_it_matters: String(it.why_it_matters ?? ''),
      how_to_fix: String(it.how_to_fix ?? ''),
      impact_score: Math.max(1, Math.min(20, Number(it.impact_score ?? 6))),
      visible_in_preview: false,
      source: 'llm',
    }));
    issues = [...issues, ...llmIssues];
  } else if (contentAuditRes.status === 'rejected') {
    logger.warn('MA_ORCH', `content audit LLM failed: ${(contentAuditRes.reason as Error)?.message}`);
  }

  // keyword fit override
  let mergedMissingForRewrite = search.missing;
  if (keywordFitRes.status === 'fulfilled' && keywordFitRes.value) {
    const kf = keywordFitRes.value;
    const covered = Array.isArray(kf.covered) ? kf.covered.filter(Boolean).slice(0, 30) : [];
    const missing = Array.isArray(kf.missing) ? kf.missing.filter(Boolean).slice(0, 30) : [];
    const coveragePct = Number.isFinite(kf.coveragePct)
      ? Math.max(0, Math.min(100, Math.round(kf.coveragePct)))
      : (covered.length + missing.length > 0
          ? Math.round((covered.length / (covered.length + missing.length)) * 100)
          : 0);
    keywords = { covered, missing, coveragePct, source: 'llm' };
    const suggested = Array.isArray(kf.suggestedKeywords) ? kf.suggestedKeywords : [];
    mergedMissingForRewrite = Array.from(new Set([...suggested, ...missing, ...search.missing])).slice(0, 16);
  } else if (keywordFitRes.status === 'rejected') {
    logger.warn('MA_ORCH', `keyword fit LLM failed: ${(keywordFitRes.reason as Error)?.message}`);
  }

  // competitor gap
  if (competitorGapRes.status === 'fulfilled' && competitorGapRes.value) {
    const cg = competitorGapRes.value;
    competitorGap = {
      weakerThan: Array.isArray(cg.weakerThan) ? cg.weakerThan.slice(0, 6) : [],
      strongerThan: Array.isArray(cg.strongerThan) ? cg.strongerThan.slice(0, 6) : [],
      priorityAdds: Array.isArray(cg.priorityAdds) ? cg.priorityAdds.slice(0, 8) : [],
      source: 'llm',
    };
  } else if (competitorGapRes.status === 'rejected') {
    logger.warn('MA_ORCH', `competitor gap LLM failed: ${(competitorGapRes.reason as Error)?.message}`);
  }

  // rewrite (sequential — depends on enriched issues + missing keywords)
  let recommendations: RecommendationsBlock = fallbackRewrite(product, mergedMissingForRewrite);
  try {
    const rewrite = await callJsonLlm<RecommendationsBlock & { bullets?: string[] }>({
      messages: buildRewriteMessages(product, issues, mergedMissingForRewrite),
      tool: REWRITE_TOOL,
      toolName: 'submit_rewrite',
      apiKey,
    });
    if (rewrite?.newTitle && rewrite?.newDescription) {
      recommendations = {
        newTitle: rewrite.newTitle,
        newDescription: rewrite.newDescription,
        bullets: Array.isArray(rewrite.bullets) ? rewrite.bullets : [],
        addKeywords: Array.isArray(rewrite.addKeywords) ? rewrite.addKeywords : [],
        removeWords: Array.isArray(rewrite.removeWords) ? rewrite.removeWords : [],
      };
    }
  } catch (e) {
    logger.warn('MA_ORCH', `rewrite LLM failed: ${(e as Error).message}`);
  }

  // Sort issues by impact_score desc
  issues.sort((a, b) => b.impact_score - a.impact_score);

  return {
    product,
    scores,
    issues,
    keywords,
    competitors: { list: competitorList, gap: competitorGap },
    recommendations,
    ai_summary: summarize(scores, issues.length),
    rules_version: getRulesVersion(),
  };
}
