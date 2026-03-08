import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileType, Copy, Download, Plus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const defaultDisallows = [
  { path: "/admin/", label: "Админ-панель", checked: true },
  { path: "/api/", label: "API-эндпоинты", checked: true },
  { path: "/search?", label: "Поиск", checked: false },
  { path: "/*.pdf$", label: "PDF-файлы", checked: false },
  { path: "/wp-admin/", label: "WordPress admin", checked: false },
  { path: "/cart/", label: "Корзина", checked: false },
];

const userAgents = ["*", "Googlebot", "Yandex", "Bingbot", "Mail.RU"];

const RobotsTxtGenerator = () => {
  const [domain, setDomain] = useState("https://example.com");
  const [agent, setAgent] = useState("*");
  const [items, setItems] = useState(defaultDisallows);
  const [customRules, setCustomRules] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [allowRules, setAllowRules] = useState<string[]>([]);
  const [allowInput, setAllowInput] = useState("");
  const [crawlDelay, setCrawlDelay] = useState("");

  const toggle = (idx: number) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  };

  const addCustom = () => {
    const v = customInput.trim();
    if (v && !customRules.includes(v)) {
      setCustomRules(prev => [...prev, v.startsWith("/") ? v : `/${v}`]);
      setCustomInput("");
    }
  };

  const addAllow = () => {
    const v = allowInput.trim();
    if (v && !allowRules.includes(v)) {
      setAllowRules(prev => [...prev, v.startsWith("/") ? v : `/${v}`]);
      setAllowInput("");
    }
  };

  const allDisallows = [
    ...items.filter(i => i.checked).map(i => i.path),
    ...customRules,
  ];

  const sitemapUrl = domain.replace(/\/+$/, "") + "/sitemap.xml";

  const result = [
    `User-agent: ${agent}`,
    ...allDisallows.map(p => `Disallow: ${p}`),
    ...allowRules.map(p => `Allow: ${p}`),
    ...(crawlDelay ? [`Crawl-delay: ${crawlDelay}`] : []),
    "",
    `Sitemap: ${sitemapUrl}`,
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast({ title: "Скопировано", description: "robots.txt скопирован в буфер обмена" });
    } catch {
      toast({ title: "Ошибка", description: "Не удалось скопировать", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "robots.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Домен сайта</label>
            <Input value={domain} onChange={e => setDomain(e.target.value)} className="bg-card border-border" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">User-agent</label>
            <Select value={agent} onValueChange={setAgent}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {userAgents.map(ua => (
                  <SelectItem key={ua} value={ua}>{ua}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {crawlDelay !== undefined && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Crawl-delay (секунды, необязательно)</label>
            <Input
              value={crawlDelay}
              onChange={e => setCrawlDelay(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="например, 10"
              className="bg-card border-border max-w-[200px]"
            />
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Disallow — блокировать разделы:</p>
          {items.map((item, idx) => (
            <label key={item.path} className="flex items-center gap-3 glass rounded-lg px-4 py-3 cursor-pointer">
              <Checkbox checked={item.checked} onCheckedChange={() => toggle(idx)} />
              <span className="text-sm text-foreground flex-1">{item.label}</span>
              <code className="text-xs text-muted-foreground">{item.path}</code>
            </label>
          ))}
          {customRules.map((rule, i) => (
            <div key={rule} className="flex items-center gap-3 glass rounded-lg px-4 py-3">
              <Checkbox checked disabled />
              <code className="text-sm text-foreground flex-1">{rule}</code>
              <button onClick={() => setCustomRules(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="/custom-path/" className="bg-card border-border" onKeyDown={e => e.key === "Enter" && addCustom()} />
            <GradientButton size="sm" onClick={addCustom} type="button"><Plus className="w-4 h-4" /></GradientButton>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Allow — разрешить разделы:</p>
          {allowRules.map((rule, i) => (
            <div key={rule} className="flex items-center gap-3 glass rounded-lg px-4 py-3">
              <code className="text-sm text-foreground flex-1">{rule}</code>
              <button onClick={() => setAllowRules(prev => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input value={allowInput} onChange={e => setAllowInput(e.target.value)} placeholder="/allowed-path/" className="bg-card border-border" onKeyDown={e => e.key === "Enter" && addAllow()} />
            <GradientButton size="sm" onClick={addAllow} type="button"><Plus className="w-4 h-4" /></GradientButton>
          </div>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Результат</p>
            <div className="flex gap-2">
              <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Copy className="w-3 h-3" /> Копировать
              </button>
              <button onClick={handleDownload} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Download className="w-3 h-3" /> Скачать
              </button>
            </div>
          </div>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{result}</pre>
        </div>
      </div>
    </div>
  );
};

export default RobotsTxtGenerator;
