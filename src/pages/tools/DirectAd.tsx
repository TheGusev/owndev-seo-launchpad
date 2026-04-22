import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DirectAdPreview from "@/components/tools/DirectAdPreview";
import DirectMeta from "@/components/tools/DirectMeta";
import { Megaphone } from "lucide-react";

/**
 * Standalone Direct Ad tool.
 * Sprint 2: extracted from /tools/site-check — site-check no longer generates ads.
 * TODO Sprint 5+: wire to dedicated /tools/direct-ad backend endpoint.
 */
const DirectAdToolPage = () => {
  return (
    <>
      <Helmet>
        <title>Генератор объявлений Яндекс.Директ — превью и CSV для Коммандера | OWNDEV</title>
        <meta
          name="description"
          content="Создайте объявление Яндекс.Директ с превью, проверкой лимитов и экспортом в CSV для Коммандера. Отдельный инструмент OWNDEV."
        />
        <link rel="canonical" href="https://owndev.ru/tools/direct-ad" />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-4xl mx-auto px-3 md:px-4 space-y-6">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Генератор объявлений Яндекс.Директ
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Инструмент находится в стадии переработки. Скоро здесь появится отдельный
            запуск анализа страницы под рекламные объявления.
          </p>

          {/* Демонстрационный preview, чтобы существующие компоненты не затерялись */}
          <DirectAdPreview
            adSuggestion={{
              headline1: "Введите URL страницы",
              headline2: "Получите готовое объявление",
              ad_text: "OWNDEV сгенерирует заголовки, текст, быстрые ссылки и уточнения по содержимому вашей посадочной страницы.",
              sitelinks: [
                { title: "Услуги", description: "Полный список" },
                { title: "Цены", description: "Прозрачно и понятно" },
                { title: "Контакты", description: "Связаться с нами" },
              ],
              callouts: ["Гарантия", "Бесплатная консультация", "Опыт 10+ лет"],
            }}
            readinessScore={0}
            url="https://example.com"
          />

          <DirectMeta data={{ autotargeting_categories: [] }} />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default DirectAdToolPage;