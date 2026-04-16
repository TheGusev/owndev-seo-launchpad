import { Button } from '@/components/ui/button';
import { Lock, Sparkles, Loader2 } from 'lucide-react';

interface UnlockCTAProps {
  onUnlock: () => void;
  loading: boolean;
}

export default function UnlockCTA({ onUnlock, loading }: UnlockCTAProps) {
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-6 sm:p-8 text-center space-y-4">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Lock className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground">Полный архитектурный Blueprint</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Получите детальный план архитектуры вашего сайта: структура URL, роли страниц,
        политика индексации, система перелинковки, план реструктуризации и пошаговые рекомендации.
      </p>
      <Button
        onClick={onUnlock}
        disabled={loading}
        size="lg"
        className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Загрузка...</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Открыть полный Blueprint</>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">Бесплатно в бета-версии</p>
    </div>
  );
}
