import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const BLOCKS = [
  {
    name: "Indexability",
    weight: 15,
    description: "Доступность страницы для поисковых роботов и AI-агентов.",
    checks: [
      { signal: "Meta robots noindex", severity: "P1", desc: "Страница закрыта от индексации через <meta name=\"robots\" content=\"noindex\">", rec: "Убрать noindex, если страница должна индексироваться" },
      { signal: "X-Robots-Tag: noindex", severity: "P1", desc: "Сервер отдаёт HTTP-заголовок X-Robots-Tag: noindex", rec: "Убрать заголовок на уровне сервера / CDN" },
      { signal: "Блокировка в robots.txt", severity: "P1", desc: "URL заблокирован через Disallow в robots.txt", rec: "Убрать блокирующее правило из robots.txt" },
      { signal: "Canonical mismatch", severity: "P2", desc: "Canonical URL не совпадает с текущим URL страницы", rec: "Указать корректный canonical, совпадающий с URL" },
      { signal: "Отсутствие robots.txt", severity: "P3", desc: "Файл robots.txt не найден по стандартному пути", rec: "Создать robots.txt с базовыми правилами" },
      { signal: "Отсутствие sitemap.xml", severity: "P3", desc: "Sitemap не найден и не указан в robots.txt", rec: "Создать и зарегистрировать sitemap.xml" },
    ],
  },
  {
    name: "Content Structure",
    weight: 20,
    description: "Качество структуры контента: заголовки, объём текста, иерархия.",
    checks: [
      { signal: "Отсутствие H1", severity: "P1", desc: "На странице нет заголовка H1", rec: "Добавить единственный H1 с основной темой страницы" },
      { signal: "Дублирование H1", severity: "P2", desc: "На странице более одного H1", rec: "Оставить один H1, остальные понизить до H2" },
      { signal: "Отсутствие H2", severity: "P2", desc: "Нет подзаголовков H2 для структурирования", rec: "Разбить контент на логические секции с H2" },
      { signal: "Малый объём текста", severity: "P2", desc: "Менее 300 слов текстового контента", rec: "Расширить контент до 300+ слов с полезной информацией" },
      { signal: "Нарушение иерархии", severity: "P3", desc: "Пропуск уровней заголовков (H1 → H3 без H2)", rec: "Соблюдать последовательность H1 → H2 → H3" },
      { signal: "Title длина", severity: "P3", desc: "Title короче 30 или длиннее 65 символов", rec: "Оптимизировать title до 50-60 символов" },
      { signal: "Meta description", severity: "P3", desc: "Отсутствует или не в диапазоне 120-160 символов", rec: "Добавить meta description 120-160 символов" },
    ],
  },
  {
    name: "AI Readiness",
    weight: 20,
    description: "Готовность контента к обработке LLM и AI-системами.",
    checks: [
      { signal: "llms.txt", severity: "P2", desc: "Наличие файла /llms.txt для AI-агентов", rec: "Создать llms.txt с описанием сайта для LLM" },
      { signal: "FAQ-секции", severity: "P2", desc: "Наличие структурированных вопросов-ответов", rec: "Добавить FAQ-блок с разметкой FAQPage" },
      { signal: "Списки и таблицы", severity: "P3", desc: "Использование <ul>/<ol>/<table> для структурирования", rec: "Оформить данные в списки и таблицы вместо сплошного текста" },
      { signal: "Прямые ответы", severity: "P3", desc: "Ответы на вопросы в первых абзацах секций", rec: "Начинать секции с прямого ответа, затем детали" },
      { signal: "Цитируемость", severity: "P3", desc: "Короткие блоки 2-3 предложения, удобные для цитирования", rec: "Разбивать текст на компактные абзацы" },
      { signal: "Семантический HTML", severity: "P3", desc: "Использование <article>, <section>, <nav>, <main>", rec: "Обернуть контент в семантические теги" },
    ],
  },
  {
    name: "Schema.org",
    weight: 15,
    description: "Структурированная разметка для поисковых систем и AI.",
    checks: [
      { signal: "JSON-LD наличие", severity: "P1", desc: "Присутствие хотя бы одного блока JSON-LD на странице", rec: "Добавить JSON-LD разметку Organization или WebPage" },
      { signal: "Рекомендуемые типы", severity: "P2", desc: "Organization, LocalBusiness, Product, FAQPage, Article", rec: "Использовать подходящий @type для контента страницы" },
      { signal: "@type и name/headline", severity: "P2", desc: "Обязательные поля @type и name заполнены", rec: "Убедиться что JSON-LD содержит @type и name" },
      { signal: "BreadcrumbList", severity: "P3", desc: "Разметка хлебных крошек для навигации", rec: "Добавить BreadcrumbList для многоуровневых сайтов" },
      { signal: "Множественные типы", severity: "P3", desc: "Несколько релевантных Schema-типов на странице", rec: "Добавить Organization + WebPage + FAQ при наличии" },
    ],
  },
  {
    name: "E-E-A-T",
    weight: 15,
    description: "Сигналы экспертности, авторитетности и доверия.",
    checks: [
      { signal: "Контактная информация", severity: "P2", desc: "Наличие email, телефона или адреса на сайте", rec: "Разместить контактные данные в footer или на отдельной странице" },
      { signal: "Социальные сети", severity: "P3", desc: "Ссылки на официальные аккаунты в соцсетях", rec: "Добавить ссылки на соцсети с rel=\"noopener\"" },
      { signal: "Авторство", severity: "P3", desc: "Указание автора для статей и публикаций", rec: "Добавить имя автора и его экспертизу к статьям" },
      { signal: "Дата публикации", severity: "P3", desc: "Наличие даты создания / обновления контента", rec: "Показывать datePublished / dateModified" },
    ],
  },
  {
    name: "Technical",
    weight: 15,
    description: "Техническое состояние: скорость, размер, доступность.",
    checks: [
      { signal: "HTTP-статус", severity: "P1", desc: "Страница отдаёт код ответа отличный от 200", rec: "Исправить серверную ошибку или редирект" },
      { signal: "Скорость загрузки", severity: "P2", desc: "Время загрузки страницы превышает 3 секунды", rec: "Оптимизировать скорость: сжатие, кэш, CDN" },
      { signal: "Размер HTML", severity: "P2", desc: "HTML-документ превышает 200 КБ", rec: "Уменьшить размер: убрать inline-стили, минифицировать" },
      { signal: "HTTPS", severity: "P1", desc: "Сайт доступен только по HTTP без SSL", rec: "Настроить SSL-сертификат и редирект на HTTPS" },
      { signal: "Viewport", severity: "P3", desc: "Отсутствует meta viewport для мобильных", rec: "Добавить <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" },
      { signal: "Favicon", severity: "P3", desc: "Favicon не найден", rec: "Добавить favicon.ico и apple-touch-icon" },
    ],
  },
];

const SEVERITY_COLORS: Record<string, string> = {
  P1: "text-red-400 bg-red-500/10 border-red-500/20",
  P2: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  P3: "text-muted-foreground bg-muted/30 border-border/20",
};

const GeoRatingMethodology = () => {
  const totalChecks = BLOCKS.reduce((s, b) => s + b.checks.length, 0);

  return (
    <>
      <Helmet>
        <title>Методология GEO Рейтинга | OWNDEV</title>
        <meta name="description" content="Как OWNDEV оценивает AI-готовность сайтов: 50+ сигналов, 6 блоков анализа, прозрачная система scoring." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://owndev.ru/" },
              { "@type": "ListItem", "position": 2, "name": "GEO Рейтинг", "item": "https://owndev.ru/geo-rating" },
              { "@type": "ListItem", "position": 3, "name": "Методология" }
            ]
          })}
        </script>
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="container max-w-4xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/geo-rating" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              GEO Рейтинг
            </Link>
            <span>/</span>
            <span className="text-foreground">Методология</span>
          </nav>

          {/* Hero */}
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Методология GEO Рейтинга</h1>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl">
            OWNDEV анализирует каждый сайт по {totalChecks}+ конкретным проверкам, сгруппированным в 6 блоков.
            Итоговый балл — средневзвешенное по блокам с штрафной системой.
          </p>

          {/* Weight table */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Веса блоков</h2>
            <div className="rounded-lg border border-border/30 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/20 text-left">
                    <th className="px-4 py-3 font-medium">Блок</th>
                    <th className="px-4 py-3 font-medium text-right">Вес</th>
                    <th className="px-4 py-3 font-medium text-right">Проверок</th>
                  </tr>
                </thead>
                <tbody>
                  {BLOCKS.map((b) => (
                    <tr key={b.name} className="border-t border-border/10">
                      <td className="px-4 py-2.5">{b.name}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{b.weight}%</td>
                      <td className="px-4 py-2.5 text-right font-mono">{b.checks.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scoring */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Система штрафов</h2>
            <p className="text-muted-foreground mb-4">
              Каждый блок стартует со 100 баллов. За каждую найденную проблему снимаются штрафные баллы в зависимости от приоритета:
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-center">
                <div className="text-red-400 font-bold text-lg">P1</div>
                <div className="text-sm text-muted-foreground">Critical</div>
                <div className="text-red-400 font-mono mt-1">−30 баллов</div>
              </div>
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-center">
                <div className="text-yellow-400 font-bold text-lg">P2</div>
                <div className="text-sm text-muted-foreground">Medium</div>
                <div className="text-yellow-400 font-mono mt-1">−15 баллов</div>
              </div>
              <div className="rounded-lg border border-border/20 bg-muted/10 p-4 text-center">
                <div className="text-muted-foreground font-bold text-lg">P3</div>
                <div className="text-sm text-muted-foreground">Low</div>
                <div className="text-muted-foreground font-mono mt-1">−5 баллов</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Итоговый балл блока: max(0, 100 − сумма штрафов). Общий балл = Σ (blockScore × blockWeight / 100).
            </p>
          </section>

          {/* Blocks detail */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Детальные проверки по блокам</h2>
            <Accordion type="multiple" className="space-y-2">
              {BLOCKS.map((block) => (
                <AccordionItem key={block.name} value={block.name} className="border border-border/20 rounded-lg px-1">
                  <AccordionTrigger className="px-3 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{block.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{block.weight}%</span>
                      <span className="text-xs text-muted-foreground">· {block.checks.length} проверок</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-3">
                    <p className="text-sm text-muted-foreground mb-3">{block.description}</p>
                    <div className="rounded-md border border-border/20 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/10 text-left">
                            <th className="px-3 py-2 font-medium">Сигнал</th>
                            <th className="px-3 py-2 font-medium w-16 text-center">Уровень</th>
                            <th className="px-3 py-2 font-medium hidden md:table-cell">Описание</th>
                            <th className="px-3 py-2 font-medium hidden lg:table-cell">Рекомендация</th>
                          </tr>
                        </thead>
                        <tbody>
                          {block.checks.map((c) => (
                            <tr key={c.signal} className="border-t border-border/10">
                              <td className="px-3 py-2 font-medium">{c.signal}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${SEVERITY_COLORS[c.severity]}`}>
                                  {c.severity}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground hidden md:table-cell">{c.desc}</td>
                              <td className="px-3 py-2 text-muted-foreground hidden lg:table-cell">{c.rec}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Aggregation */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold mb-4">Агрегация для рейтинга</h2>
            <div className="rounded-lg border border-border/20 bg-muted/5 p-5 space-y-3 text-sm text-muted-foreground">
              <p><strong className="text-foreground">LLM Score</strong> — средневзвешенное блоков AI Readiness (40%) + Schema.org (30%) + Content Structure (30%). Показывает готовность сайта к AI-системам.</p>
              <p><strong className="text-foreground">SEO Score</strong> — средневзвешенное блоков Indexability (25%) + Content Structure (25%) + Technical (25%) + E-E-A-T (25%). Классическое SEO-здоровье.</p>
              <p><strong className="text-foreground">Ранжирование</strong> — сайты сортируются по LLM Score (основной), затем SEO Score (вторичный). Top-3 получают выделение.</p>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center">
            <Link to="/tools/site-check">
              <Button size="lg" className="gap-2">
                <Search className="w-4 h-4" />
                Проверить свой сайт
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default GeoRatingMethodology;
