import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { getLastUrl } from "@/utils/lastUrl";

const SiteCheckBanner = () => {
  const savedUrl = getLastUrl();
  const to = savedUrl ? `/tools/site-check?url=${encodeURIComponent(savedUrl)}` : "/tools/site-check";

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-4 flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
      <Search className="w-5 h-5 text-primary shrink-0" />
      <p className="text-sm text-foreground flex-1">
        Хотите проверить весь сайт сразу? SEO, Директ, конкуренты — в одном отчёте.
      </p>
      <Link
        to={to}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
      >
        Запустить проверку
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};

export default SiteCheckBanner;
