import { useRef, useEffect } from "react";
import { Clock, Banknote, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  problemsData,
  solutionsData,
  servicesData,
  type ProblemCardData,
  type ServiceCardData,
} from "@/data/scrollStacksData";

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  stickyTopDesktop: 110,
  stickyTopMobile: 88,
  stackOffsetY: 28,
  stackScaleStep: 0.018,
  revealDistance: 200,
  stackTrigger: 0.8,
};

// ============================================
// STACK CARD
// ============================================
const StackCard = ({
  children,
  index,
  totalCards,
  stickyTop,
  isMobile = false,
}: {
  children: React.ReactNode;
  index: number;
  totalCards: number;
  stickyTop: number;
  isMobile?: boolean;
}) => {
  const topOffset = stickyTop + index * CONFIG.stackOffsetY;
  const zIndex = isMobile ? 10 + index : totalCards - index;

  return (
    <div
      className="stack-card sticky will-change-transform"
      data-progress="0"
      data-sticky-top={topOffset}
      style={{ top: `${topOffset}px`, zIndex, transformOrigin: "top center" }}
    >
      {children}
    </div>
  );
};

// ============================================
// PROBLEM CARD
// ============================================
const ProblemCard = ({ data }: { data: ProblemCardData }) => {
  const Icon = data.icon;
  return (
    <div className="glass rounded-2xl p-5 border border-destructive/20 hover:border-destructive/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-card ${data.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${data.statusColor}`}>
          {data.status}
        </span>
      </div>
      <h4 className="font-bold text-base mb-2">{data.title}</h4>
      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{data.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {data.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
          ))}
        </div>
        <span className="text-xs font-mono text-destructive">{data.meta}</span>
      </div>
    </div>
  );
};

// ============================================
// SOLUTION CARD
// ============================================
const SolutionCard = ({ data }: { data: ProblemCardData }) => {
  const Icon = data.icon;
  return (
    <div className="glass rounded-2xl p-5 border border-success/20 hover:border-success/40 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-card ${data.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${data.statusColor}`}>
          {data.status}
        </span>
      </div>
      <h4 className="font-bold text-base mb-2">{data.title}</h4>
      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{data.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {data.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{tag}</span>
          ))}
        </div>
        <span className="text-xs font-mono text-success">{data.meta}</span>
      </div>
    </div>
  );
};

// ============================================
// SERVICE CARD
// ============================================
const colorMap: Record<string, { border: string; icon: string }> = {
  primary: { border: "border-t-primary", icon: "text-primary" },
  accent: { border: "border-t-accent", icon: "text-accent" },
  secondary: { border: "border-t-secondary", icon: "text-secondary" },
  success: { border: "border-t-success", icon: "text-success" },
};

const ServiceCard = ({ data }: { data: ServiceCardData }) => {
  const Icon = data.icon;
  const c = colorMap[data.color] || colorMap.primary;

  return (
    <div className={`glass rounded-2xl p-5 border-t-4 ${c.border} ${data.highlight ? "ring-2 ring-primary/50" : ""}`}>
      {data.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">Рекомендуем</span>
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2.5 rounded-xl bg-card ${c.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-sm leading-tight pt-1">{data.title}</h4>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">🎯</span>
          <span className="text-foreground text-xs">{data.goal}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground text-xs">{data.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <Banknote className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={`font-semibold text-xs ${data.highlight ? "text-success" : "text-foreground"}`}>{data.price}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-foreground text-xs">{data.audience}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STACK COLUMN
// ============================================
const StackColumn = ({
  title,
  titleAccent,
  accentColor,
  children,
}: {
  title: string;
  titleAccent: string;
  accentColor: string;
  children: React.ReactNode;
}) => (
  <div className="stack-column">
    <h3 className="text-xl md:text-2xl font-bold font-serif mb-6 sticky top-20 z-50 bg-background/80 backdrop-blur-sm py-2">
      {title} <span className={accentColor}>{titleAccent}</span>
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

// ============================================
// RENDER COLUMN HELPER
// ============================================
const renderColumn = (
  columnTitle: string,
  accent: string,
  accentColor: string,
  items: ProblemCardData[] | ServiceCardData[],
  CardComponent: React.ComponentType<{ data: any }>,
  stickyTop: number,
  headerOffset: number,
  isMobile: boolean,
) => (
  <StackColumn title={columnTitle} titleAccent={accent} accentColor={accentColor}>
    {items.map((item, index) => (
      <StackCard
        key={item.title}
        index={index}
        totalCards={items.length}
        stickyTop={stickyTop + headerOffset}
        isMobile={isMobile}
      >
        <CardComponent data={item} />
      </StackCard>
    ))}
  </StackColumn>
);

// ============================================
// MAIN COMPONENT
// ============================================
const ScrollStacksSection = () => {
  const isMobile = useIsMobile();
  const stickyTop = isMobile ? CONFIG.stickyTopMobile : CONFIG.stickyTopDesktop;
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let rafId = 0;
    const cachedStickyTops = new Map<HTMLElement, number>();

    const updateProgress = () => {
      const cards = section.querySelectorAll<HTMLElement>(".stack-card");

      if (cachedStickyTops.size === 0) {
        cards.forEach((card) => {
          cachedStickyTops.set(card, parseFloat(card.dataset.stickyTop || "0"));
        });
      }

      const cardArray = Array.from(cards);
      cardArray.forEach((card, i) => {
        const st = cachedStickyTops.get(card) || 0;
        const distFromSticky = card.getBoundingClientRect().top - st;
        const p = Math.min(1, Math.max(0, 1 - distFromSticky / CONFIG.revealDistance));

        card.style.setProperty("--p", p.toFixed(3));
        card.dataset.progress = p.toFixed(2);

        if (p > 0) card.classList.add("is-visible");

        if (i > 0 && p > CONFIG.stackTrigger) {
          cardArray[i - 1].classList.add("is-stacked");
        } else if (i > 0) {
          cardArray[i - 1].classList.remove("is-stacked");
        }
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    requestAnimationFrame(updateProgress);

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  const headerOffset = isMobile ? 40 : 48;
  const redAccent = "bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent";

  return (
    <section id="scroll-stacks" ref={sectionRef} className="relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(222_47%_10%),transparent_70%)]" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Проблемы → <span className="text-gradient">Решения</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Мы понимаем боли вашего бизнеса и знаем, как их решить
          </p>
        </div>

        {/* Desktop: 3 columns */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 pb-32">
          {renderColumn("С этим сталкиваются", "все", redAccent, problemsData, ProblemCard, stickyTop, headerOffset, false)}
          {renderColumn("Как мы это", "решаем", "text-gradient", solutionsData, SolutionCard, stickyTop, headerOffset, false)}
          {renderColumn("Что мы можем", "разработать", "text-gradient", servicesData, ServiceCard, stickyTop, headerOffset, false)}
        </div>

        {/* Mobile: Sequential stacks */}
        <div className="md:hidden space-y-16 pb-16">
          {renderColumn("С этим сталкиваются", "все", redAccent, problemsData, ProblemCard, stickyTop, headerOffset, true)}
          {renderColumn("Как мы это", "решаем", "text-gradient", solutionsData, SolutionCard, stickyTop, headerOffset, true)}
          {renderColumn("Что мы можем", "разработать", "text-gradient", servicesData, ServiceCard, stickyTop, headerOffset, true)}
        </div>
      </div>
    </section>
  );
};

export default ScrollStacksSection;
