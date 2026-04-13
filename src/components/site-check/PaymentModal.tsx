import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanId: string;
  url: string;
}

export function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  const [email, setEmail] = useState("");

  const handlePay = () => {
    toast.info("Оплата временно недоступна", {
      description: "Сайт проходит проверку в платёжной системе. Напишите нам в Telegram @one_help для получения полного аудита.",
      duration: 8000,
    });
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
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
            <span className="text-sm text-muted-foreground">Стоимость</span>
            <span className="text-xl font-bold text-foreground">1 490 ₽</span>
          </div>

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
            />
          </div>

          <Button
            variant="hero"
            className="w-full gap-2"
            onClick={handlePay}
            disabled={!email}
          >
            <CreditCard className="w-4 h-4" />
            Оплатить 1 490 ₽
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            ⏳ Подключение платёжной системы в процессе
          </p>

          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Visa · MasterCard · МИР · SBP</span>
          </div>

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