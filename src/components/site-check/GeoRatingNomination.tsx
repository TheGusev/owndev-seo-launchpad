import { useState } from "react";
import { Trophy, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/lib/api/config";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";

const CATEGORIES = [
  "E-commerce", "Медиа", "Банки", "Сервисы", "Образование",
  "Госорганы", "Телеком", "Здоровье", "Авто", "Недвижимость", "Услуги", "Другое",
];

interface Props {
  totalScore: number;
  url: string;
  scanId?: string;
}

const GeoRatingNomination = ({ totalScore, url, scanId }: Props) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [brandName, setBrandName] = useState(() => {
    try { return new URL((url || '').startsWith("http") ? url : `https://${url}`).hostname.replace("www.", ""); } catch { return url || ''; }
  });
  const [category, setCategory] = useState("Другое");
  const [email, setEmail] = useState("");

  // Guards AFTER all hooks
  if (!url || typeof url !== 'string') return null;
  if (totalScore < 70 || sent) return null;

  const domain = (() => {
    try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace("www.", ""); } catch { return url; }
  })();

  const handleSubmit = async () => {
    if (!brandName.trim()) return;
    setSending(true);
    try {
const resp = await fetch(apiUrl('/site-check/nomination'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          display_name: brandName.trim(),
          category,
          email: email.trim() || null,
          scan_id: scanId || null,
          total_score: totalScore,
        }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${resp.status}`);
      }
      setOpen(false);
      toast({ title: "Заявка отправлена!", description: "Мы проверим ваш сайт и добавим в рейтинг." });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Не удалось отправить заявку", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <Trophy className="w-5 h-5 text-primary" />
          <Badge variant="outline" className="text-xs border-primary/30 text-primary">{totalScore}/100</Badge>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Ваш сайт набрал {totalScore}/100 — это уровень ТОП-рейтинга!
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Добавьте сайт в{" "}
            <Link to="/geo-rating" className="text-primary hover:underline">GEO Рейтинг Рунета</Link>
            {" "}— бесплатно.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)} className="shrink-0">
          Добавить в рейтинг <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Заявка в GEO Рейтинг</DialogTitle>
            <DialogDescription>
              Мы проверим данные и добавим ваш сайт в открытый рейтинг AI-готовности.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Домен</label>
              <Input value={domain} disabled className="bg-muted/30" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Название бренда</label>
              <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Мой бренд" maxLength={100} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Категория</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email (необязательно)</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email" maxLength={255} />
              <p className="text-[10px] text-muted-foreground mt-1">Уведомим, когда сайт появится в рейтинге</p>
            </div>
            <Button onClick={handleSubmit} disabled={sending || !brandName.trim()} className="w-full">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Отправить заявку
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeoRatingNomination;
