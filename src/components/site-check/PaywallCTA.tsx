import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, FileText, Download, Users, Search, MinusCircle, Sparkles, Loader2 } from "lucide-react";

interface PaywallCTAProps {
  issueCount: number;
  onPay: (email: string) => void;
  loading?: boolean;
}

const features = [
  { icon: FileText, text: "Все найденные проблемы с инструкциями" },
  { icon: Search, text: "200+ ключевых запросов с кластерами" },
  { icon: MinusCircle, text: "Минус-слова для Яндекс.Директа" },
  { icon: Users, text: "Сравнение с топ-10 конкурентами" },
  { icon: Sparkles, text: "Готовый заголовок объявления для Директа" },
  { icon: Download, text: "Экспорт: PDF, DOCX, CSV" },
];

const PaywallCTA = ({ issueCount, onPay, loading }: PaywallCTAProps) => {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <div className="rounded-2xl border border-primary/20 bg-card/80 p-6 md:p-8 space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">Полный отчёт включает</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Найдено {issueCount} проблем — в бесплатной версии показаны только 5
        </p>
      </div>

      <ul className="space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-foreground">
            <f.icon className="w-4 h-4 text-primary shrink-0" />
            {f.text}
          </li>
        ))}
      </ul>

      <div className="border-t border-border/30 pt-5">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-foreground">1 490 ₽</span>
          <span className="text-sm text-muted-foreground">единоразово</span>
        </div>

        {!showEmail ? (
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={() => setShowEmail(true)}
          >
            <Lock className="w-4 h-4" />
            Получить полный отчёт
          </Button>
        ) : (
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="your@email.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-muted/50"
            />
            <Button
              variant="hero"
              size="lg"
              className="w-full"
              disabled={!email.includes("@") || loading}
              onClick={() => onPay(email)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Создаём отчёт...
                </>
              ) : (
                "Перейти к оплате"
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Ссылка на отчёт будет отправлена на указанный email
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaywallCTA;
