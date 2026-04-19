import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import type { ResultResponse } from '@/lib/marketplace-audit-types';

export default function MarketplaceHero({ result }: { result: ResultResponse }) {
  return (
    <Card className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-6">
        {result.product.images?.[0] && (
          <img
            src={result.product.images[0]}
            alt=""
            className="w-full md:w-40 h-40 object-cover rounded-lg bg-muted"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">{result.platform === 'wb' ? 'Wildberries' : 'Ozon'}</Badge>
            {result.product.category && <Badge variant="secondary">{result.product.category}</Badge>}
          </div>
          <h1 className="text-xl md:text-2xl font-bold mb-3 break-words">
            {result.product.title || 'Без названия'}
          </h1>
          {result.ai_summary && (
            <p className="text-muted-foreground flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <span>{result.ai_summary}</span>
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
