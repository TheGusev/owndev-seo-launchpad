import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UnlockCTAProps {
  onUnlock: () => void;
  loading: boolean;
}

export default function UnlockCTA({ onUnlock, loading }: UnlockCTAProps) {
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-5 sm:p-8 text-center space-y-4">
      <Badge className="bg-success/15 text-success border-success/30 border gap-1">
        <Gift className="h-3 w-3" /> Beta — бесплатно
      </Badge>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-foreground">Полный архитектурный Blueprint</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Детальный план: структура URL, роли страниц, политика индексации, перелинковка,
        план реструктуризации и пошаговые рекомендации. Экспорт в PDF и Word.
      </p>
      <Button
        onClick={onUnlock}
        disabled={loading}
        size="lg"
        className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Открываем...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Открыть Blueprint бесплатно</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">
        В период беты — без оплаты. Доступ откроется мгновенно.
      </p>
    </div>
  );
}
