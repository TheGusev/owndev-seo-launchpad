import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { RecommendationsBlock } from '@/lib/marketplace-audit-types';

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-sm font-medium ${className}`}>{children}</div>;
}

function isFull(r: RecommendationsBlock | Record<string, never>): r is RecommendationsBlock {
  return !!(r as RecommendationsBlock).newTitle;
}

export default function RewriteSuggestions({
  recommendations,
}: {
  recommendations: RecommendationsBlock | Record<string, never>;
}) {
  if (!isFull(recommendations)) return null;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Скопировано');
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Что переписать</h2>
      <Card className="p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Новый заголовок</Label>
            <Button variant="ghost" size="sm" onClick={() => copy(recommendations.newTitle)}>
              <Copy className="w-3 h-3 mr-1" /> Копировать
            </Button>
          </div>
          <p className="p-3 rounded-md bg-muted/40 text-sm">{recommendations.newTitle}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Новое описание</Label>
            <Button variant="ghost" size="sm" onClick={() => copy(recommendations.newDescription)}>
              <Copy className="w-3 h-3 mr-1" /> Копировать
            </Button>
          </div>
          <p className="p-3 rounded-md bg-muted/40 text-sm whitespace-pre-wrap">
            {recommendations.newDescription}
          </p>
        </div>

        {recommendations.bullets?.length > 0 && (
          <div>
            <Label>Буллеты выгод</Label>
            <ul className="mt-2 space-y-1 text-sm">
              {recommendations.bullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.addKeywords?.length > 0 && (
            <div>
              <Label>Добавить ключи</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recommendations.addKeywords.map((k) => (
                  <Badge key={k} variant="outline">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {recommendations.removeWords?.length > 0 && (
            <div>
              <Label>Убрать слова</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recommendations.removeWords.map((k) => (
                  <Badge key={k} variant="destructive">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
