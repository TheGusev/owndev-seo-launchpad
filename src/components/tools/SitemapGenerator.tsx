import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { FileCode, Copy } from "lucide-react";

const SitemapGenerator = () => {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Список URL (по одному на строку)</label>
          <Textarea
            placeholder={"https://example.com/\nhttps://example.com/about\nhttps://example.com/services"}
            className="bg-card border-border min-h-[160px]"
          />
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <FileCode className="w-5 h-5 mr-2" />
            Сгенерировать sitemap.xml
          </GradientButton>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Результат</p>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Copy className="w-3 h-3" /> Копировать
            </button>
          </div>
          <pre className="text-xs text-muted-foreground overflow-x-auto">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SitemapGenerator;
