import { Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getToolBySlug } from "@/data/tools-registry";
import { ArrowLeft } from "lucide-react";

const ToolPage = () => {
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const tool = toolSlug ? getToolBySlug(toolSlug) : undefined;

  if (!tool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-serif mb-4">Инструмент не найден</h1>
          <Link to="/tools" className="text-primary hover:underline">← Все инструменты</Link>
        </div>
      </div>
    );
  }

  const ToolComponent = tool.component;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container px-4 md:px-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link to="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] py-2">
              <ArrowLeft className="w-4 h-4" />
              Все инструменты
            </Link>
          </div>

          {/* Tool header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
              <tool.icon className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">{tool.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif mb-3">{tool.name}</h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">{tool.shortDesc}</p>
          </div>

          {/* Tool widget */}
          <div className="max-w-[900px] mx-auto mb-10">
            <Suspense fallback={<div className="glass rounded-2xl p-8 text-center text-muted-foreground">Загрузка…</div>}>
              <ToolComponent />
            </Suspense>
          </div>

          {/* Use cases */}
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Когда использовать</p>
            <ul className="flex flex-wrap justify-center gap-2">
              {tool.useCases.map((uc) => (
                <li key={uc} className="glass px-3 py-2 rounded-full text-sm text-muted-foreground">{uc}</li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mt-10 max-w-lg mx-auto">
            Быстрый чек — не заменяет полноценный аудит. Результаты носят ориентировочный характер.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ToolPage;
