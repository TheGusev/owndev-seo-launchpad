import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useMarketplaceAudit } from '@/hooks/useMarketplaceAudit';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, ArrowLeft, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Запуск аудита…',
  parsing: 'Получаем данные карточки…',
  scoring: 'Оцениваем контент и поиск…',
  llm: 'AI анализирует карточку…',
  done: 'Готово',
  error: 'Ошибка',
};

function ScoreCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'primary' }) {
  const color =
    value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-yellow-400' : value >= 40 ? 'text-orange-400' : 'text-red-400';
  return (
    <Card className={`p-5 ${tone === 'primary' ? 'border-primary/40 bg-primary/5' : ''}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{value}<span className="text-base text-muted-foreground">/100</span></div>
    </Card>
  );
}

export default function MarketplaceAuditResult() {
  const { id } = useParams<{ id: string }>();
  const { preview, result, loading, error } = useMarketplaceAudit(id);

  const status = preview?.status ?? 'pending';
  const progress = preview?.progress_pct ?? 0;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано');
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Результат аудита карточки — OWNDEV</title>
      </Helmet>
      <Header />

      <main className="container px-4 md:px-6 py-10 max-w-5xl mx-auto">
        <Link to="/marketplace-audit" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Новый аудит
        </Link>

        {error && (
          <Card className="p-6 border-destructive/40 bg-destructive/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold mb-1">Не удалось выполнить аудит</h2>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Link to="/marketplace-audit">
                  <Button variant="outline" size="sm">Попробовать через ручной ввод</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {!error && !result && (
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{STATUS_LABELS[status] ?? 'Обработка…'}</h2>
            <p className="text-muted-foreground text-sm mb-6">Обычно занимает 20–40 секунд</p>
            <div className="max-w-md mx-auto">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
            </div>
          </Card>
        )}

        {result && result.scores && 'total' in result.scores && (
          <div className="space-y-6">
            {/* Hero */}
            <Card className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {result.product.images?.[0] && (
                  <img src={result.product.images[0]} alt="" className="w-full md:w-40 h-40 object-cover rounded-lg bg-muted" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{result.platform === 'wb' ? 'Wildberries' : 'Ozon'}</Badge>
                    {result.product.category && <Badge variant="secondary">{result.product.category}</Badge>}
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold mb-3">{result.product.title || 'Без названия'}</h1>
                  <p className="text-muted-foreground flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {result.ai_summary}
                  </p>
                </div>
              </div>
            </Card>

            {/* Scores */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Оценка карточки</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <ScoreCard label="Total" value={result.scores.total} tone="primary" />
                <ScoreCard label="Контент" value={result.scores.content} />
                <ScoreCard label="Поиск" value={result.scores.search} />
                <ScoreCard label="Конверсия" value={result.scores.conversion} />
                <ScoreCard label="Реклама" value={result.scores.ads} />
              </div>
            </div>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Что мешает росту</h2>
                <div className="space-y-3">
                  {result.issues.slice(0, 8).map((issue) => (
                    <Card key={issue.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <Badge
                          variant={issue.severity === 'critical' || issue.severity === 'high' ? 'destructive' : 'secondary'}
                          className="shrink-0"
                        >
                          {issue.severity}
                        </Badge>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{issue.title}</h3>
                          {issue.found && <p className="text-xs text-muted-foreground mb-2">Найдено: {issue.found}</p>}
                          <p className="text-sm text-muted-foreground mb-2">{issue.why_it_matters}</p>
                          <p className="text-sm"><span className="text-primary font-medium">Что делать: </span>{issue.how_to_fix}</p>
                          {issue.example_fix && (
                            <p className="text-xs text-muted-foreground mt-2 italic">Пример: {issue.example_fix}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Rewrite */}
            {result.recommendations && 'newTitle' in result.recommendations && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Что переписать</h2>
                <Card className="p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Новый заголовок</Label>
                      <Button variant="ghost" size="sm" onClick={() => copy(result.recommendations.newTitle as string)}>
                        <Copy className="w-3 h-3 mr-1" /> Копировать
                      </Button>
                    </div>
                    <p className="p-3 rounded-md bg-muted/40 text-sm">{result.recommendations.newTitle}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Новое описание</Label>
                      <Button variant="ghost" size="sm" onClick={() => copy(result.recommendations.newDescription as string)}>
                        <Copy className="w-3 h-3 mr-1" /> Копировать
                      </Button>
                    </div>
                    <p className="p-3 rounded-md bg-muted/40 text-sm whitespace-pre-wrap">{result.recommendations.newDescription}</p>
                  </div>
                  {result.recommendations.bullets?.length > 0 && (
                    <div>
                      <Label>Буллеты выгод</Label>
                      <ul className="mt-2 space-y-1 text-sm">
                        {result.recommendations.bullets.map((b: string, i: number) => (
                          <li key={i} className="flex gap-2"><span className="text-primary">•</span>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.recommendations.addKeywords?.length > 0 && (
                      <div>
                        <Label>Добавить ключи</Label>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {result.recommendations.addKeywords.map((k: string) => (
                            <Badge key={k} variant="outline">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.recommendations.removeWords?.length > 0 && (
                      <div>
                        <Label>Убрать слова</Label>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {result.recommendations.removeWords.map((k: string) => (
                            <Badge key={k} variant="destructive">{k}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Keywords */}
            {result.keywords && (result.keywords.covered.length + result.keywords.missing.length) > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Покрытие ключевых слов — {result.keywords.coveragePct}%</h2>
                <Card className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-emerald-400">Найдены в карточке ({result.keywords.covered.length})</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.keywords.covered.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}
                      {result.keywords.covered.length === 0 && <p className="text-xs text-muted-foreground">Пока пусто</p>}
                    </div>
                  </div>
                  <div>
                    <Label className="text-orange-400">Отсутствуют ({result.keywords.missing.length})</Label>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.keywords.missing.map((k) => <Badge key={k} variant="outline">{k}</Badge>)}
                      {result.keywords.missing.length === 0 && <p className="text-xs text-muted-foreground">Все ключи покрыты</p>}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* CTA */}
            <Card className="p-6 md:p-8 text-center bg-gradient-to-br from-primary/10 to-violet-950/20 border-primary/30">
              <h2 className="text-xl font-bold mb-2">Хотите больше?</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Полный аудит, экспорт отчёта, массовая проверка каталога и еженедельный мониторинг — скоро.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/contacts"><Button>Связаться с нами</Button></Link>
                <Link to="/marketplace-audit"><Button variant="outline">Проверить ещё карточку</Button></Link>
              </div>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}
