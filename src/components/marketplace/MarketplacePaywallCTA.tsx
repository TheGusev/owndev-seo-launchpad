import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MarketplacePaywallCTA() {
  return (
    <Card className="p-6 md:p-8 text-center bg-gradient-to-br from-primary/10 to-violet-950/20 border-primary/30">
      <h2 className="text-xl font-bold mb-2">Хотите больше?</h2>
      <p className="text-muted-foreground mb-4 text-sm">
        Полный аудит, экспорт отчёта, массовая проверка каталога и еженедельный мониторинг — скоро.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/contacts">
          <Button>Связаться с нами</Button>
        </Link>
        <Link to="/marketplace-audit">
          <Button variant="outline">Проверить ещё карточку</Button>
        </Link>
      </div>
    </Card>
  );
}
