import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Запуск аудита…',
  parsing: 'Получаем данные карточки…',
  scoring: 'Оцениваем контент и поиск…',
  llm: 'AI анализирует карточку…',
  done: 'Готово',
  error: 'Ошибка',
};

export function MarketplaceLoadingCard({ status, progress }: { status: string; progress: number }) {
  return (
    <Card className="p-8 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">{STATUS_LABELS[status] ?? 'Обработка…'}</h2>
      <p className="text-muted-foreground text-sm mb-6">Обычно занимает 20–40 секунд</p>
      <div className="max-w-md mx-auto">
        <Progress value={progress} />
        <p className="text-xs text-muted-foreground mt-2">{progress}%</p>
      </div>
    </Card>
  );
}

export function MarketplaceErrorCard({ message }: { message: string }) {
  return (
    <Card className="p-6 border-destructive/40 bg-destructive/5">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <h2 className="font-semibold mb-1">Не удалось выполнить аудит</h2>
          <p className="text-sm text-muted-foreground mb-4">{message}</p>
          <Link to="/marketplace-audit">
            <Button variant="outline" size="sm">
              Попробовать через ручной ввод
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
