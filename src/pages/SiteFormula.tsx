import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Layers, Shield, Target, Zap, FileText, CheckCircle2 } from 'lucide-react';

const FORMULA_LAYERS = [
  { icon: Target, title: 'Карта спроса', desc: 'Анализ реального спроса и кластеризация запросов' },
  { icon: Layers, title: 'Слои интентов', desc: 'Разделение пользовательских намерений по типам страниц' },
  { icon: Shield, title: 'Безопасная индексация', desc: 'Строгая политика: что индексировать, а что — нет' },
  { icon: Zap, title: 'Внутренний вес', desc: 'Модульная перелинковка и распределение авторитета' },
  { icon: FileText, title: 'Система конверсии', desc: 'Единая система обработки заявок и CTA' },
  { icon: CheckCircle2, title: 'Управляемый рост', desc: 'Масштабирование только того, что структурно безопасно' },
];

export default function SiteFormula() {
  return (
    <>
      <Helmet>
        <title>OwnDev Site Formula — архитектура сервисного сайта | OWNDEV</title>
        <meta name="description" content="Получите архитектурный blueprint вашего сервисного сайта. Карта спроса, роли страниц, политика индексации — всё в одном отчёте." />
      </Helmet>
      <Header />
      <main className="min-h-screen bg-background pt-20">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 sm:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_60%)]" />
          <div className="container relative mx-auto max-w-4xl px-4 text-center space-y-6">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Beta
            </Badge>
            <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Site Formula
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Архитектурный blueprint для сервисного сайта. Ответьте на несколько вопросов о бизнесе —
              получите профессиональный план структуры: какие страницы создать, что индексировать,
              как масштабироваться безопасно — включая расчёт стоимости разработки.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
                <Link to="/site-formula/wizard">
                  Начать анализ <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Formula Layers */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-bold text-center mb-2">Что анализирует формула</h2>
            <p className="text-center text-muted-foreground mb-10">
              6 слоёв архитектуры, которые определяют структуру вашего сайта
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FORMULA_LAYERS.map((layer) => (
                <div
                  key={layer.title}
                  className="group rounded-xl border border-border bg-card p-5 space-y-3 transition-all hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.06)]"
                >
                  <layer.icon className="h-8 w-8 text-primary" />
                  <h3 className="font-semibold text-foreground">{layer.title}</h3>
                  <p className="text-sm text-muted-foreground">{layer.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 sm:py-16 border-t border-border">
          <div className="container mx-auto max-w-3xl px-4 space-y-8">
            <h2 className="text-2xl font-bold text-center">Как это работает</h2>
            <div className="space-y-6">
              {[
                { step: '1', title: 'Ответьте на вопросы', desc: 'Простые вопросы о бизнесе: услуги, география, источники трафика' },
                { step: '2', title: 'Движок анализирует', desc: 'Backend-engine применяет 18+ правил с приоритетами P0–P4' },
                { step: '3', title: 'Получите blueprint', desc: 'Профессиональный архитектурный план: структура, роли страниц, индексация' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center pt-4">
              <Button asChild size="lg" className="gap-2">
                <Link to="/site-formula/wizard">
                  Начать <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
