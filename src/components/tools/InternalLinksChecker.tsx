import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Link2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockPages = [
  { url: "/services", links: 12, orphan: false },
  { url: "/about", links: 5, orphan: false },
  { url: "/blog/old-post", links: 0, orphan: true },
  { url: "/services/moscow", links: 8, orphan: false },
];

const InternalLinksChecker = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">URL сайта</label>
          <Input placeholder="https://example.com" className="bg-card border-border" />
        </div>

        <div className="text-center space-y-2">
          <GradientButton size="lg" disabled>
            <Link2 className="w-5 h-5 mr-2" />
            Проверить перелинковку
          </GradientButton>
          <Badge variant="secondary" className="ml-2">Скоро</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground mb-2">Пример результата (демо)</p>
          {mockPages.map((p) => (
            <div key={p.url} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              {p.orphan ? (
                <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              )}
              <span className="text-sm text-foreground flex-1 font-mono">{p.url}</span>
              <span className="text-xs text-muted-foreground">{p.links} ссылок</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InternalLinksChecker;
