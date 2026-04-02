const SkeletonCard = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="glass rounded-xl p-6 animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 bg-muted/20 rounded-lg" />
      <div className="flex-1">
        <div className="h-4 bg-muted/20 rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted/20 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 bg-muted/20 rounded w-full" />
      <div className="h-3 bg-muted/20 rounded w-5/6" />
      <div className="h-3 bg-muted/20 rounded w-4/6" />
    </div>
    <div className="mt-4 flex gap-2">
      <div className="h-8 bg-muted/20 rounded-full w-20" />
      <div className="h-8 bg-muted/20 rounded-full w-16" />
    </div>
  </div>
);

const SkeletonScore = ({ delay = 0 }: { delay?: number }) => (
  <div
    className="flex flex-col items-center animate-pulse"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-muted/20 mb-3" />
    <div className="h-4 bg-muted/20 rounded w-20" />
  </div>
);

const SkeletonResultsGrid = () => (
  <div className="space-y-8">
    <div className="flex justify-center gap-8 md:gap-12">
      <SkeletonScore delay={0} />
      <SkeletonScore delay={100} />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} delay={i * 100} />
      ))}
    </div>
  </div>
);

export { SkeletonCard, SkeletonScore, SkeletonResultsGrid };
