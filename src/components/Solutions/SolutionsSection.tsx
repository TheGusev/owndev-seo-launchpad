import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Rocket, 
  ShieldCheck,
  Blocks, 
  TrendingUp, 
  BrainCircuit, 
  Server,
  LucideIcon 
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { copy } from "@/content/copy";
import { solutions, type Solution } from "@/data/solutionsData";

const iconMap: Record<Solution["icon"], LucideIcon> = {
  mvp: Rocket,
  security: ShieldCheck,
  blockchain: Blocks,
  analytics: TrendingUp,
  ai: BrainCircuit,
  devops: Server,
};

const SolutionCard = ({ solution }: { solution: Solution }) => (
  <Card 
    as="article"
    className="group flex flex-col h-full relative overflow-hidden"
  >
    {/* Background image layer */}
    {solution.image && (
      <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <img 
          src={solution.image} 
          alt="" 
          className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/90 to-card/70" />
      </div>
    )}
    
    {/* Icon */}
    <div className="text-accent mb-4 group-hover:scale-110 transition-transform duration-300">
      {(() => {
        const IconComponent = iconMap[solution.icon];
        return <IconComponent className="w-8 h-8" aria-hidden="true" />;
      })()}
    </div>
    
    {/* Title */}
    <h3 className="text-xl font-semibold text-foreground mb-3">
      {solution.title}
    </h3>
    
    {/* Description */}
    <p className="text-muted-foreground leading-relaxed mb-4">
      {solution.description}
    </p>

    {/* Features */}
    <ul className="space-y-2 mb-6 flex-grow">
      {solution.features.map((feature, index) => (
        <li 
          key={index} 
          className="flex items-start gap-2 text-muted-foreground text-sm"
        >
          <span className="text-accent mt-0.5 flex-shrink-0">•</span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>

    {/* Metrics */}
    {solution.metrics && solution.metrics.length > 0 && (
      <div className="flex gap-6 pt-6 border-t border-border/50">
        {solution.metrics.map((metric, index) => (
          <div key={index}>
            <span className="text-2xl md:text-3xl font-bold text-accent">
              {metric.value}
            </span>
            <p className="text-sm text-muted-foreground mt-1">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    )}
  </Card>
);

const SolutionsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Intersection Observer for dot indicator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = cardRefs.current.findIndex((ref) => ref === entry.target);
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
      }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const setCardRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[index] = el;
  }, []);

  return (
    <section 
      id="solutions" 
      className="py-24 md:py-32"
      aria-labelledby="solutions-title"
    >
      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 
            id="solutions-title" 
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            {copy.solutions.title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {copy.solutions.subtitle}
          </p>
        </div>

        {/* Mobile: horizontal scroll with snap */}
        <div 
          ref={scrollContainerRef}
          className="md:hidden overflow-x-auto scrollbar-hide -mx-6 px-6 pb-4"
        >
          <div className="flex gap-4 snap-x snap-mandatory">
            {solutions.map((solution, index) => (
              <div 
                key={solution.id}
                ref={setCardRef(index)}
                className="snap-center flex-shrink-0 w-[85vw]"
              >
                <SolutionCard solution={solution} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Swipe indicator */}
        <div className="md:hidden flex items-center justify-center gap-3 mt-4 text-muted-foreground text-sm">
          <img 
            src="https://01.tech/images/vector/swipe.svg" 
            alt="" 
            className="w-6 h-6 opacity-60"
            aria-hidden="true"
          />
          <span>Свайпайте влево или вправо</span>
        </div>

        {/* Mobile: Dot indicator */}
        <div className="md:hidden flex justify-center gap-2 mt-4">
          {solutions.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                cardRefs.current[index]?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'nearest',
                  inline: 'center'
                });
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeIndex === index 
                  ? 'bg-accent w-4' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Перейти к карточке ${index + 1}`}
            />
          ))}
        </div>

        {/* Desktop/Tablet: grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((solution) => (
            <SolutionCard key={solution.id} solution={solution} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
