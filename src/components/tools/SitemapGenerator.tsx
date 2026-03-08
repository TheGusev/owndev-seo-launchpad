import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { FileCode, Copy, Download, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ===== SITEMAP =====
function normalizeUrls(raw: string): string[] {
  return [...new Set(
    raw.split("\n").map((u) => u.trim()).filter((u) => u.length > 0)
      .filter((u) => { try { new URL(u.startsWith("http") ? u : `https://${u}`); return true; } catch { return false; } })
      .map((u) => (u.startsWith("http") ? u : `https://${u}`))
  )];
}

function generateSitemapXml(urls: string[]): string {
  const entries = urls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n    <priority>${u.replace(/\/$/, "").split("/").length <= 3 ? "1.0" : "0.8"}</priority>\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

// ===== ROBOTS =====
interface RobotsConfig {
  userAgent: string;
  sitemapUrl: string;
  disallow: string[];
  allow: string[];
  crawlDelay: string;
}

function generateRobotsTxt(config: RobotsConfig): string {
  let lines: string[] = [`User-agent: ${config.userAgent || "*"}`];
  for (const d of config.disallow) { if (d.trim()) lines.push(`Disallow: ${d.trim()}`); }
  for (const a of config.allow) { if (a.trim()) lines.push(`Allow: ${a.trim()}`); }
  if (config.crawlDelay) lines.push(`Crawl-delay: ${config.crawlDelay}`);
  lines.push("");
  if (config.sitemapUrl.trim()) lines.push(`Sitemap: ${config.sitemapUrl.trim()}`);
  return lines.join("\n");
}

const commonDisallow = ["/admin/", "/wp-admin/", "/search", "/cart", "/checkout", "/api/", "/tmp/", "/*.pdf$"];

const SitemapGenerator = () => {
  // Sitemap state
  const [smInput, setSmInput] = useState("");
  const [smXml, setSmXml] = useState("");
  const [smCopied, setSmCopied] = useState(false);
  const [smUrlCount, setSmUrlCount] = useState(0);

  // Robots state
  const [rbConfig, setRbConfig] = useState<RobotsConfig>({ userAgent: "*", sitemapUrl: "", disallow: ["/admin/"], allow: ["/"], crawlDelay: "" });
  const [rbResult, setRbResult] = useState("");
  const [rbCopied, setRbCopied] = useState(false);

  const handleSitemapGenerate = () => {
    const urls = normalizeUrls(smInput);
    if (urls.length === 0) { toast({ title: "Введите хотя бы один URL", variant: "destructive" }); return; }
    setSmUrlCount(urls.length);
    setSmXml(generateSitemapXml(urls));
  };

  const handleCopy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    toast({ title: "Скопировано!" });
    setTimeout(() => setter(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleRobotsGenerate = () => {
    setRbResult(generateRobotsTxt(rbConfig));
  };

  const toggleDisallow = (path: string) => {
    setRbConfig((prev) => ({
      ...prev,
      disallow: prev.disallow.includes(path) ? prev.disallow.filter((d) => d !== path) : [...prev.disallow, path],
    }));
  };

  return (
    <div className="glass rounded-2xl p-5 md:p-8">
      <Tabs defaultValue="sitemap" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="sitemap">Sitemap.xml</TabsTrigger>
          <TabsTrigger value="robots">Robots.txt</TabsTrigger>
        </TabsList>

        <TabsContent value="sitemap" className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Список URL (по одному на строку)</label>
            <Textarea placeholder={"https://example.com/\nhttps://example.com/about"} className="bg-card border-border min-h-[160px]" value={smInput} onChange={(e) => setSmInput(e.target.value)} />
          </div>
          <div className="text-center">
            <GradientButton size="lg" onClick={handleSitemapGenerate}><FileCode className="w-5 h-5 mr-2" /> Сгенерировать sitemap.xml</GradientButton>
          </div>
          {smXml && (
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Результат ({smUrlCount} URL)</p>
                <div className="flex gap-3">
                  <button onClick={() => handleCopy(smXml, setSmCopied)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    {smCopied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />} {smCopied ? "Скопировано" : "Копировать"}
                  </button>
                  <button onClick={() => handleDownload(smXml, "sitemap.xml")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Download className="w-3 h-3" /> Скачать
                  </button>
                </div>
              </div>
              <pre className="text-xs text-muted-foreground overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap">{smXml}</pre>
            </div>
          )}
        </TabsContent>

        <TabsContent value="robots" className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">User-agent</label>
              <Input className="bg-card border-border" value={rbConfig.userAgent}
                onChange={(e) => setRbConfig({ ...rbConfig, userAgent: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sitemap URL</label>
              <Input className="bg-card border-border" placeholder="https://example.com/sitemap.xml"
                value={rbConfig.sitemapUrl} onChange={(e) => setRbConfig({ ...rbConfig, sitemapUrl: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Disallow (быстрый выбор)</label>
            <div className="flex flex-wrap gap-2">
              {commonDisallow.map((path) => (
                <button key={path} onClick={() => toggleDisallow(path)}
                  className={`text-xs px-3 py-2 rounded-lg transition-colors min-h-[36px] ${rbConfig.disallow.includes(path) ? "bg-destructive/20 text-destructive" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                  {path}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Crawl-delay (сек, необязательно)</label>
            <Input className="bg-card border-border" placeholder="10"
              value={rbConfig.crawlDelay} onChange={(e) => setRbConfig({ ...rbConfig, crawlDelay: e.target.value })} />
          </div>

          <div className="text-center">
            <GradientButton size="lg" onClick={handleRobotsGenerate}><FileCode className="w-5 h-5 mr-2" /> Сгенерировать robots.txt</GradientButton>
          </div>

          {rbResult && (
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Robots.txt</p>
                <div className="flex gap-3">
                  <button onClick={() => handleCopy(rbResult, setRbCopied)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    {rbCopied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />} {rbCopied ? "Скопировано" : "Копировать"}
                  </button>
                  <button onClick={() => handleDownload(rbResult, "robots.txt")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Download className="w-3 h-3" /> Скачать
                  </button>
                </div>
              </div>
              <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap">{rbResult}</pre>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SitemapGenerator;
