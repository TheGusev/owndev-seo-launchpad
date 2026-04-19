import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MarketplaceDownloadButtons from './MarketplaceDownloadButtons';
import type { ResultResponse } from '@/lib/marketplace-audit-types';

interface Props {
  result?: ResultResponse;
}

export default function MarketplacePaywallCTA({ result }: Props) {
  return (
    <Card className="p-6 md:p-8 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
      {result ? (
        <>
          <h2 className="text-xl font-bold mb-2">Скачать отчёт</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            Полный отчёт по карточке в PDF или Word — можно отправить команде или сохранить в архив.
          </p>
          <div className="max-w-md mx-auto mb-6">
            <MarketplaceDownloadButtons result={result} />
          </div>
          <div className="border-t border-border/40 pt-5">
            <p className="text-muted-foreground mb-3 text-sm">
              Массовая проверка каталога и еженедельный мониторинг — скоро.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/contacts">
                <Button>Связаться с нами</Button>
              </Link>
              <Link to="/marketplace-audit">
                <Button variant="outline">Проверить ещё карточку</Button>
              </Link>
            </div>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </Card>
  );
}
