import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useMarketplaceAudit } from '@/hooks/useMarketplaceAudit';
import { ArrowLeft } from 'lucide-react';
import {
  MarketplaceHero,
  MarketplaceScoreCards,
  IssuesByImpact,
  RewriteSuggestions,
  CompetitorGap,
  KeywordCoverage,
  MarketplacePaywallCTA,
  MarketplaceLoadingCard,
  MarketplaceErrorCard,
} from '@/components/marketplace';

export default function MarketplaceAuditResult() {
  const { id } = useParams<{ id: string }>();
  const { preview, result, error } = useMarketplaceAudit(id);

  const status = preview?.status ?? 'pending';
  const progress = preview?.progress_pct ?? 0;
  const hasScores = !!result?.scores && 'total' in (result.scores as object);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Результат аудита карточки — OWNDEV</title>
      </Helmet>
      <Header />

      <main className="container px-4 md:px-6 py-10 max-w-5xl mx-auto">
        <Link
          to="/marketplace-audit"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Новый аудит
        </Link>

        {error && <MarketplaceErrorCard message={error} />}

        {!error && !hasScores && (
          <MarketplaceLoadingCard status={status} progress={progress} />
        )}

        {hasScores && result && (
          <div className="space-y-6">
            <MarketplaceHero result={result} />
            <MarketplaceScoreCards scores={result.scores as any} />
            <IssuesByImpact issues={result.issues} />
            <RewriteSuggestions recommendations={result.recommendations} />
            <CompetitorGap competitors={result.competitors} />
            <KeywordCoverage keywords={result.keywords} />
            <MarketplacePaywallCTA />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
