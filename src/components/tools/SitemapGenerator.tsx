import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { FileCode, Copy, Download, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function normalizeUrls(raw: string): string[] {
  return [...new Set(
    raw
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .filter((u) => {
        try {
          new URL(u.startsWith("http") ? u : `https://${u}`);
          return true;
        } catch {
          return false;
        }
      })
      .map((u) => (u.startsWith("http") ? u : `https://${u}`))
  )];
}

function generateSitemapXml(urls: string[]): string {
  const entries = urls
    .map(
      (u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n    <priority>${u.replace(/\/$/, "").split("/").length <= 3 ? "1.0" : "0.8"}</priority>\n  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
}

const SitemapGenerator = () => {
  const [input, setInput] = useState("");
  const [xml, setXml] = useState("");
  const [copied, setCopied] = useState(false);
  const [urlCount, setUrlCount] = useState(0);

  const handleGenerate = () => {
    const urls = normalizeUrls(input);
    if (urls.length === 0) {
      toast({ title: "Введите хотя бы один URL", variant: "destructive" });
      return;
    }
    setUrlCount(urls.length);
    setXml(generateSitemapXml(urls));
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(xml);
    setCopied(true);
    toast({ title: "Скопировано!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Список URL (по одному на строку)</label>
          <Textarea
            placeholder={"https://example.com/\nhttps://example.com/about\nhttps://example.com/services"}
            className="bg-card border-border min-h-[160px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <div className="text-center">
          <GradientButton size="lg" onClick={handleGenerate}>
            <FileCode className="w-5 h-5 mr-2" />
            Сгенерировать sitemap.xml
          </GradientButton>
        </div>

        {xml && (
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">
                Результат ({urlCount} URL)
              </p>
              <div className="flex gap-3">
                <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {copied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Скопировано" : "Копировать"}
                </button>
                <button onClick={handleDownload} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Download className="w-3 h-3" /> Скачать
                </button>
              </div>
            </div>
            <pre className="text-xs text-muted-foreground overflow-x-auto max-h-[300px] overflow-y-auto whitespace-pre-wrap">
              {xml}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default SitemapGenerator;
