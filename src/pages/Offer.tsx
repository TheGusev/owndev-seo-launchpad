import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const Offer = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <MouseGradient />
      <ClickRipple />
      <Header />
      <Helmet>
        <title>Оферта | OWNDEV</title>
        <meta name="description" content="Публичная оферта на услугу «Полный отчёт Проверки сайта» на owndev.ru." />
        <link rel="canonical" href="https://owndev.ru/offer" />
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

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Публичная оферта</h1>

            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-muted-foreground text-sm">Дата публикации: 27 марта 2026 г.</p>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Общие положения</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Настоящий документ является официальным предложением (публичной офертой) сайта OWNDEV (owndev.ru)
                  о предоставлении платной услуги «Полный отчёт Проверки сайта» любому лицу, принявшему условия данной оферты.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Акцептом (принятием) оферты является факт оплаты услуги. С момента оплаты договор считается заключённым.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Предмет оферты</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Исполнитель предоставляет Заказчику доступ к полному отчёту проверки сайта, включающему:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Технический SEO-аудит</li>
                  <li>Аудит контента</li>
                  <li>Анализ совместимости с Яндекс.Директ (автотаргетинг)</li>
                  <li>Конкурентный анализ топ-10</li>
                  <li>Генерация семантического ядра (ключевые запросы)</li>
                  <li>Генерация минус-слов для рекламных кампаний</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Стоимость и порядок оплаты</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Стоимость услуги: <strong className="text-foreground">1 490 ₽</strong> (единоразовый платёж).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Оплата производится онлайн через платёжный сервис ЮKassa.
                  Принимаются банковские карты (Visa, Mastercard, МИР), электронные кошельки и другие способы оплаты,
                  доступные в ЮKassa.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Порядок оказания услуги</h2>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                  <li>Заказчик вводит URL сайта для проверки и указывает email.</li>
                  <li>После оплаты система автоматически генерирует полный отчёт.</li>
                  <li>Ссылка на отчёт отправляется на указанный email.</li>
                  <li>Отчёт доступен по ссылке в течение 72 часов с момента генерации.</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Права и обязанности сторон</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Исполнитель обязуется предоставить отчёт в полном объёме в автоматическом режиме после подтверждения оплаты.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Заказчик обязуется указать корректный email для получения результатов и корректный URL для анализа.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Возврат средств</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Условия возврата средств описаны в{" "}
                  <Link to="/refund" className="text-primary hover:underline">Политике возврата</Link>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Ответственность</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Отчёт формируется на основе автоматического анализа и носит рекомендательный характер.
                  Исполнитель не гарантирует конкретных результатов продвижения сайта Заказчика.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Контакты</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a>
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Telegram: <a href="https://t.me/one_help" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">@one_help</a>
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

export default Offer;
