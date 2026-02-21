import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileType, Copy } from "lucide-react";

const defaultDisallows = [
  { path: "/admin/", label: "Админ-панель", checked: true },
  { path: "/api/", label: "API-эндпоинты", checked: true },
  { path: "/search?", label: "Поиск", checked: false },
  { path: "/*.pdf$", label: "PDF-файлы", checked: false },
];

const RobotsTxtGenerator = () => {
  const [items, setItems] = useState(defaultDisallows);

  const toggle = (idx: number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  };

  const result = `User-agent: *\n${items.filter((i) => i.checked).map((i) => `Disallow: ${i.path}`).join("\n")}\n\nSitemap: https://example.com/sitemap.xml`;

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Домен сайта</label>
          <Input placeholder="https://example.com" className="bg-card border-border" />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Блокировать разделы:</p>
          {items.map((item, idx) => (
            <label key={item.path} className="flex items-center gap-3 glass rounded-lg px-4 py-3 cursor-pointer">
              <Checkbox checked={item.checked} onCheckedChange={() => toggle(idx)} />
              <span className="text-sm text-foreground flex-1">{item.label}</span>
              <code className="text-xs text-muted-foreground">{item.path}</code>
            </label>
          ))}
        </div>

        <div className="text-center">
          <GradientButton size="lg">
            <FileType className="w-5 h-5 mr-2" />
            Сгенерировать robots.txt
          </GradientButton>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Результат</p>
            <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Copy className="w-3 h-3" /> Копировать
            </button>
          </div>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{result}</pre>
        </div>
      </div>
    </div>
  );
};

export default RobotsTxtGenerator;
