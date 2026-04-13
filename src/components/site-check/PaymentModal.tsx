import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanId: string;
  url: string;
}

export function PaymentModal({ open, onOpenChange, scanId, url }: PaymentModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePay = async () => {
    if (!email || !email.includes("@")) {
      toast({ title: "Укажите email", description: "Нужен корректный email для получения отчёта", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("yukassa-create-payment", {
        body: { scan_id: scanId, email, url },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error("Не получена ссылка на оплату");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      toast({
        title: "Ошибка оплаты",
        description: err.message || "Попробуйте снова позже",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Полный GEO-аудит</DialogTitle>
          <DialogDescription>
            Получите расширенный анализ с ключевыми словами, конкурентами и рекомендациями для Яндекс.Директ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">Стоимость</span>
            <span className="text-xl font-bold text-foreground">1 490 ₽</span>
          </div>

          {/* What's included */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Включено:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ 200+ ключевых запросов с частотностью</li>
              <li>✓ Конкурентный анализ топ-10</li>
              <li>✓ Минус-слова для рекламы</li>
              <li>✓ Объявление для Яндекс.Директ</li>
              <li>✓ AI-видимость в нейросетях</li>
              <li>✓ Экспорт PDF / Word / CSV</li>
            </ul>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="payment-email" className="text-sm font-medium text-foreground">
              Email для получения отчёта
            </label>
            <Input
              id="payment-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Pay button */}
          <Button
            variant="hero"
            className="w-full gap-2"
            onClick={handlePay}
            disabled={loading || !email}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            {loading ? "Перенаправляем..." : "Оплатить 1 490 ₽"}
          </Button>

          {/* Payment methods */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Visa · MasterCard · МИР · SBP</span>
          </div>

          {/* Legal links */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
            <Link to="/offer" className="hover:underline">Оферта</Link>
            <span>·</span>
            <Link to="/refund" className="hover:underline">Возврат</Link>
            <span>·</span>
            <Link to="/privacy" className="hover:underline">Конфиденциальность</Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
