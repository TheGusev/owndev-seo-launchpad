import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const Refund = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <MouseGradient />
      <ClickRipple />
      <Header />
      <Helmet>
        <title>Политика возврата | OWNDEV</title>
        <meta name="description" content="Политика возврата средств за услугу «Полный отчёт Проверки сайта» на owndev.ru." />
        <link rel="canonical" href="https://owndev.ru/refund" />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <main className="pt-24 pb-16 relative">
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid theme="primary" lineCount={{ h: 3, v: 4 }} />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container px-4 md:px-6 max-w-3xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Link>

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Политика возврата</h1>

            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-muted-foreground text-sm">Дата публикации: 27 марта 2026 г.</p>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Основания для возврата</h2>
                <p className="text-muted-foreground leading-relaxed">Возврат средств осуществляется в следующих случаях:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Отчёт не был сгенерирован из-за технического сбоя на стороне сервиса</li>
                  <li>Оплата прошла, но ссылка на отчёт не была доставлена на указанный email</li>
                  <li>Двойное списание средств за одну и ту же проверку</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Сроки возврата</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Возврат средств производится в течение <strong className="text-foreground">5 рабочих дней</strong> с момента подтверждения обоснованности обращения.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Средства возвращаются тем же способом, которым была произведена оплата.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Порядок обращения</h2>
                <p className="text-muted-foreground leading-relaxed">Для оформления возврата свяжитесь с нами любым удобным способом:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a></li>
                  <li>Telegram: <a href="https://t.me/one_help" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">@one_help</a></li>
                </ul>
                <p className="text-muted-foreground leading-relaxed mt-2">
                  В обращении укажите email, использованный при оплате, и опишите проблему.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Случаи отказа в возврате</h2>
                <p className="text-muted-foreground leading-relaxed">Возврат не производится, если:</p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Отчёт был успешно сгенерирован и доставлен на указанный email</li>
                  <li>Отчёт был открыт по ссылке (зафиксирован факт доступа)</li>
                  <li>Заказчик указал некорректный email и не обратился для исправления в течение 72 часов</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Контакты</h2>
                <p className="text-muted-foreground leading-relaxed">
                  По всем вопросам возврата:{" "}
                  <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a>
                  {" "}или{" "}
                  <a href="https://t.me/one_help" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">@one_help</a>
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Refund;
