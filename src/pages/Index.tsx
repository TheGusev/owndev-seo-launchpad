import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WhatIsPSEO from "@/components/WhatIsPSEO";
import ToolNavigation from "@/components/ToolNavigation";
import ToolScreen from "@/components/ToolScreen";
import PSEOGenerator from "@/components/tools/PSEOGenerator";
import AntiDuplicateChecker from "@/components/tools/AntiDuplicateChecker";
import AICitationChecker from "@/components/tools/AICitationChecker";
import ROICalculatorTool from "@/components/tools/ROICalculatorTool";
import GEOCoverageMap from "@/components/tools/GEOCoverageMap";
import CasesResults from "@/components/CasesResults";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";
import { Sparkles, Shield, Bot, Calculator, MapPin } from "lucide-react";
import { useEffect, useRef } from "react";

const TOTAL_TOOLS = 5;

const Index = () => {
  const toolsContainerRef = useRef<HTMLDivElement>(null);

  // Stacking effect: IntersectionObserver adds is-behind to previous sections
  useEffect(() => {
    const container = toolsContainerRef.current;
    if (!container) return;

    const sections = container.querySelectorAll<HTMLElement>('.tool-section');
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const idx = Array.from(sections).indexOf(target);
          // When a section enters viewport, mark the previous one as behind
          if (idx > 0) {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
              sections[idx - 1].classList.add('is-behind');
            } else if (!entry.isIntersecting) {
              sections[idx - 1].classList.remove('is-behind');
            }
          }
        });
      },
      { threshold: [0, 0.3, 0.6, 1] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <MouseGradient />
      <ClickRipple />
      
      <Header />
      <main>
        <Hero />
        <WhatIsPSEO />
        <ToolNavigation />

        <div ref={toolsContainerRef}>
          <ToolScreen
            id="tool-generator"
            index={1}
            total={TOTAL_TOOLS}
            icon={Sparkles}
            title="pSEO Generator"
            subtitle="Массовая генерация структуры GEO‑страниц для городов и ниш."
            gradient="bg-gradient-to-br from-accent/10 via-transparent to-secondary/10"
            useCases={["Старт нового pSEO‑проекта", "Структура для копирайтеров", "Импорт в CMS"]}
          >
            <PSEOGenerator />
          </ToolScreen>

          <ToolScreen
            id="tool-anti-duplicate"
            index={2}
            total={TOTAL_TOOLS}
            icon={Shield}
            title="Anti‑Duplicate Checker"
            subtitle="Проверка текста на шаблонность и риск деиндексации."
            gradient="bg-gradient-to-br from-destructive/10 via-transparent to-secondary/10"
            useCases={["Перед массовой загрузкой", "После генерации нейросетью", "Аудит GEO‑страниц"]}
          >
            <AntiDuplicateChecker />
          </ToolScreen>

          <ToolScreen
            id="tool-ai-check"
            index={3}
            total={TOTAL_TOOLS}
            icon={Bot}
            title="AI Citation Checker"
            subtitle="Готовность страницы к Perplexity, ChatGPT и AI‑обзорам."
            gradient="bg-gradient-to-br from-primary/10 via-transparent to-accent/10"
            useCases={["Контент‑хабы под AI‑трафик", "Обновление посадочных"]}
          >
            <AICitationChecker />
          </ToolScreen>

          <ToolScreen
            id="tool-roi"
            index={4}
            total={TOTAL_TOOLS}
            icon={Calculator}
            title="ROI Calculator"
            subtitle="Прогноз трафика, лидов и окупаемости pSEO‑проекта."
            gradient="bg-gradient-to-br from-success/10 via-transparent to-primary/10"
            useCases={["Оценка бюджета", "Презентация для руководства"]}
          >
            <ROICalculatorTool />
          </ToolScreen>

          <ToolScreen
            id="tool-geo"
            index={5}
            total={TOTAL_TOOLS}
            icon={MapPin}
            title="GEO Coverage Map"
            subtitle="Планирование охвата городов России для pSEO‑проекта."
            gradient="bg-gradient-to-br from-accent/10 via-transparent to-primary/10"
            useCases={["Выбор регионов", "Анализ охвата населения"]}
          >
            <GEOCoverageMap />
          </ToolScreen>
        </div>

        <CasesResults />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
