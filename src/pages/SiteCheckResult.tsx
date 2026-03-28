import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScoreCards from "@/components/site-check/ScoreCards";
import IssueCardComponent from "@/components/site-check/IssueCard";
import PaywallCTA from "@/components/site-check/PaywallCTA";
import { getScanPreview } from "@/lib/site-check-api";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, Rocket, Send, History } from "lucide-react";
import { addToHistory } from "@/utils/scanHistory";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ymGoal } from "@/utils/analytics";

const SiteCheckResult = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentEmail, setPaymentEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!scanId) return;
    getScanPreview(scanId)
      .then((d) => {
        setData(d);
        if (d && scanId) {
          addToHistory({ scanId, url: d.url, date: new Date().toISOString(), scores: d.scores });
        }
      })
      .catch(() => toast({ title: "Ошибка", description: "Не удалось загрузить результаты", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [scanId, toast]);

  const handlePay = async (email: string) => {
    setPaymentEmail(email);
    setShowPaymentModal(true);
  };

  const handleNotifyMe = async () => {
    if (!paymentEmail.trim()) {
      toast({ title: "Введите email", variant: "destructive" });
      return;
    }
    setSending(true);
    ymGoal("email_submitted");
    try {
      await supabase.functions.invoke("send-telegram", {
        body: {
          name: "Ожидание оплаты",
          phone: "—",
          email: paymentEmail.trim(),
          service: "Site Check — полный отчёт",
          message: `Пользователь ожидает подключения оплаты. URL проверки: ${data?.url || "—"}`,
        },
      });
      toast({ title: "Вы в списке! 🎉", description: "Мы уведомим вас первыми о запуске и дадим скидку 30%." });
      setShowPaymentModal(false);
      setPaymentEmail("");
    } catch {
      toast({ title: "Ошибка", description: "Попробуйте позже", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <p className="text-muted-foreground">Результаты не найдены</p>
            <Link to="/tools/site-check" className="text-primary mt-4 inline-block">Запустить новую проверку</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Результат проверки — {data.url} | OwnDev</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-4 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Link to="/tools/site-check" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Новая проверка
              </Link>
              <span className="text-muted-foreground/40">|</span>
              <Link to="/tools/site-check#history" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <History className="w-4 h-4" />
                История проверок
              </Link>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">Результат проверки</h1>
              <a href={data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
                {data.url}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            {data.theme && (
              <p className="text-sm text-muted-foreground mt-1">Тематика: {data.theme}</p>
            )}
          </div>

          {data.scores && <ScoreCards scores={data.scores} />}

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Топ-5 критичных проблем
            </h2>
            <div className="space-y-3">
              {(data.issues || []).map((issue: any) => (
                <IssueCardComponent key={issue.id} issue={issue} locked />
              ))}
              {(!data.issues || data.issues.length === 0) && (
                <p className="text-sm text-muted-foreground">Критичных проблем не найдено 🎉</p>
              )}
            </div>
          </div>

          <PaywallCTA issueCount={data.issue_count || 0} onPay={handlePay} loading={false} />
        </div>
      </main>
      <Footer />

      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Платежи скоро появятся
            </DialogTitle>
            <DialogDescription>
              Мы подключаем оплату. Оставьте email — мы уведомим вас первыми о запуске и дадим скидку 30%.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={paymentEmail}
              onChange={(e) => setPaymentEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleNotifyMe()}
            />
            <Button onClick={handleNotifyMe} disabled={sending} className="w-full">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Уведомить меня
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SiteCheckResult;
