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
        <meta name="description" content="Публичная оферта на услугу «Полный GEO-аудит сайта» на owndev.ru." />
        <link rel="canonical" href="https://owndev.ru/offer" />
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

            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">Публичная оферта</h1>

            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-muted-foreground text-sm">Дата публикации: 13 апреля 2026 г.</p>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Общие положения</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Настоящий документ является официальным предложением (публичной офертой) ИП (ИНН 511007293446),
                  действующего под брендом OWNDEV (сайт owndev.ru), о предоставлении платной услуги
                  «Полный GEO-аудит сайта» любому лицу, принявшему условия данной оферты.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Акцептом (принятием) оферты является факт оплаты услуги. С момента оплаты договор считается заключённым
                  в соответствии со ст. 437 и ст. 438 Гражданского кодекса Российской Федерации.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Предмет оферты</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Исполнитель предоставляет Заказчику доступ к полному отчёту GEO-аудита сайта, включающему:
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Технический SEO-аудит</li>
                  <li>Аудит контента и структуры</li>
                  <li>Анализ совместимости с Яндекс.Директ (автотаргетинг)</li>
                  <li>Проверку AI-видимости (упоминания в нейросетях)</li>
                  <li>Конкурентный анализ топ-10</li>
                  <li>Генерацию семантического ядра (200+ ключевых запросов)</li>
                  <li>Генерацию минус-слов для рекламных кампаний</li>
                  <li>Генерацию объявления для Яндекс.Директ</li>
                  <li>Экспорт в PDF, Word и CSV</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Стоимость и порядок оплаты</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Стоимость услуги: <strong className="text-foreground">1 490 ₽</strong> (один платёж, включая НДС при применимости).
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Оплата производится онлайн через платёжный сервис ЮKassa (ООО «ЮКасса», ИНН 7750005725).
                  Принимаются банковские карты Visa, Mastercard, МИР, оплата через СБП и другие способы,
                  доступные в ЮKassa.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Платёжные данные (номер карты, срок действия, CVV) обрабатываются исключительно ЮKassa
                  в соответствии со стандартом PCI DSS. Исполнитель не получает и не хранит платёжные реквизиты Заказчика.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Порядок оказания услуги</h2>
                <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                  <li>Заказчик вводит URL сайта для проверки и указывает email.</li>
                  <li>Заказчик производит оплату через ЮKassa.</li>
                  <li>После подтверждения оплаты система автоматически выполняет полный GEO-аудит.</li>
                  <li>Результаты отображаются на странице сайта и доступны для скачивания.</li>
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
                <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Реквизиты Исполнителя</h2>
                <ul className="list-none text-muted-foreground space-y-2">
                  <li><strong className="text-foreground">Статус:</strong> Индивидуальный предприниматель</li>
                  <li><strong className="text-foreground">ИНН:</strong> 511007293446</li>
                  <li><strong className="text-foreground">Бренд:</strong> OWNDEV</li>
                  <li>Email: <a href="mailto:west-centro@mail.ru" className="text-primary hover:underline">west-centro@mail.ru</a></li>
                  <li>Telegram: <a href="https://t.me/one_help" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">@one_help</a></li>
                </ul>
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
