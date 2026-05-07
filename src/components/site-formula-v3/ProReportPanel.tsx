/**
 * components/site-formula-v3/ProReportPanel.tsx
 *
 * PR-6 «Фронт + отчёт» — карточка PRO-отчёта на странице SiteFormulaV3.
 *
 * Берёт result.pro_report (опциональное поле, заполняется только при наличии
 * engine_state и/или известного project_code) и рисует:
 *
 *   1. Класс проекта (start | growth | scale) + причину.
 *   2. Применённые axis-веса и порог total_score.
 *   3. KPI-блок вертикали (CR, AOV, CPA, ЧИ, цикл сделки).
 *   4. ROI-расчёт (визиты, лиды, продажи, доход в месяц).
 *   5. Decision trace из ядра v1 (свернутый список).
 *
 * Если в pro_report нет какой-то секции — она не отрисовывается.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TrendingUp, Target, BarChart3, Settings2 } from 'lucide-react';
import type { ProReportV3 } from '@/lib/api/formulaV3';

interface ProReportPanelProps {
  report: ProReportV3;
}

const CLASS_LABELS: Record<NonNullable<ProReportV3['project_class']>, string> = {
  start: 'Стартап',
  growth: 'Рост',
  scale: 'Масштаб',
};

const CLASS_COLORS: Record<NonNullable<ProReportV3['project_class']>, string> = {
  start: 'bg-blue-100 text-blue-800 border-blue-200',
  growth: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  scale: 'bg-purple-100 text-purple-800 border-purple-200',
};

const MONETIZATION_LABELS: Record<string, string> = {
  lead_gen: 'Лидогенерация',
  transaction: 'Прямая продажа',
  subscription: 'Подписка',
  commission: 'Комиссия (агрегатор)',
  advertising: 'Реклама',
  donation: 'Пожертвования',
  institutional: 'Институциональный',
  brand: 'Брендовый',
  install: 'Установки приложения',
};

function formatRub(v?: number): string {
  if (v === undefined || v === 0) return '—';
  return `${v.toLocaleString('ru-RU')} ₽`;
}

function formatNum(v?: number): string {
  if (v === undefined) return '—';
  return v.toLocaleString('ru-RU');
}

export function ProReportPanel({ report }: ProReportPanelProps) {
  const profile = report.vertical_profile;
  const roi = report.roi_estimate;

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          PRO-отчёт
        </CardTitle>
        <CardDescription>
          Рекомендации, KPI и ROI-оценка для вашей ниши
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* ── 1. Класс проекта ── */}
        {report.project_class && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Класс проекта
              </span>
              <Badge className={`${CLASS_COLORS[report.project_class]} border`}>
                {CLASS_LABELS[report.project_class]}
              </Badge>
            </div>
            {report.project_class_reason && (
              <p className="text-sm text-muted-foreground">{report.project_class_reason}</p>
            )}
            {(report.axis_weights || report.total_score_threshold !== undefined) && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                {report.total_score_threshold !== undefined && (
                  <div className="rounded border bg-background p-2">
                    <div className="text-muted-foreground">Порог total</div>
                    <div className="font-semibold">≥ {report.total_score_threshold}</div>
                  </div>
                )}
                {report.axis_weights && (
                  <>
                    <div className="rounded border bg-background p-2">
                      <div className="text-muted-foreground">SEO</div>
                      <div className="font-semibold">×{report.axis_weights.SEO.toFixed(2)}</div>
                    </div>
                    <div className="rounded border bg-background p-2">
                      <div className="text-muted-foreground">Direct</div>
                      <div className="font-semibold">×{report.axis_weights.DIRECT.toFixed(2)}</div>
                    </div>
                    <div className="rounded border bg-background p-2">
                      <div className="text-muted-foreground">Schema</div>
                      <div className="font-semibold">×{report.axis_weights.SCHEMA.toFixed(2)}</div>
                    </div>
                    <div className="rounded border bg-background p-2">
                      <div className="text-muted-foreground">AI/LLM</div>
                      <div className="font-semibold">×{report.axis_weights.AI_LLM.toFixed(2)}</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 2. Профиль вертикали ── */}
        {profile && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Ваша ниша</span>
              <Badge variant="outline">
                {MONETIZATION_LABELS[profile.monetization] ?? profile.monetization}
              </Badge>
            </div>
            <h3 className="font-semibold">{profile.title_ru}</h3>
            <p className="text-sm text-muted-foreground mb-3">{profile.description_ru}</p>

            {report.kpi_summary && report.kpi_summary.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {report.kpi_summary.map((line, i) => (
                  <div key={i} className="text-sm rounded bg-muted/40 px-3 py-2">
                    {line}
                  </div>
                ))}
              </div>
            )}

            {profile.demand_triggers.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-muted-foreground mb-1">Триггеры спроса:</div>
                <div className="flex flex-wrap gap-1">
                  {profile.demand_triggers.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 3. ROI-оценка ── */}
        {roi && (
          <div className="rounded-lg border bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold">ROI-оценка месяц</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Визиты</div>
                <div className="text-lg font-bold">{formatNum(roi.expected_monthly_visits)}</div>
              </div>
              {roi.expected_monthly_leads !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground">Лиды</div>
                  <div className="text-lg font-bold">{formatNum(roi.expected_monthly_leads)}</div>
                </div>
              )}
              {roi.expected_monthly_sales !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground">Продажи</div>
                  <div className="text-lg font-bold">{formatNum(roi.expected_monthly_sales)}</div>
                </div>
              )}
              {roi.expected_monthly_revenue_rub !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground">Доход / мес</div>
                  <div className="text-lg font-bold text-emerald-700">
                    {formatRub(roi.expected_monthly_revenue_rub)}
                  </div>
                </div>
              )}
            </div>
            {roi.expected_monthly_acquisition_cost_rub !== undefined && (
              <div className="mt-3 text-sm text-muted-foreground">
                Стоимость привлечения лидов: ~{formatRub(roi.expected_monthly_acquisition_cost_rub)}/мес
              </div>
            )}
            {roi.rationale_ru && (
              <p className="mt-2 text-xs text-muted-foreground italic">{roi.rationale_ru}.</p>
            )}
          </div>
        )}

        {/* ── 4. Decision trace ── */}
        {report.decision_trace && report.decision_trace.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="trace">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4" />
                  Решения движка ({report.decision_trace.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-xs">
                  {report.decision_trace.slice(0, 20).map((d, i) => (
                    <div key={i} className="rounded border bg-background p-2">
                      <div className="flex items-center gap-2 mb-1">
                        {d.rule_id && <Badge variant="outline" className="text-[10px]">{String(d.rule_id)}</Badge>}
                        {(d as Record<string, unknown>).effect_type !== undefined && (
                          <span className="text-muted-foreground">{String((d as Record<string, unknown>).effect_type)}</span>
                        )}
                      </div>
                      {d.reason_human && <div>{String(d.reason_human)}</div>}
                      {d.effect_detail && <div className="text-muted-foreground">{String(d.effect_detail)}</div>}
                    </div>
                  ))}
                  {report.decision_trace.length > 20 && (
                    <div className="text-center text-muted-foreground">
                      … и ещё {report.decision_trace.length - 20}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
