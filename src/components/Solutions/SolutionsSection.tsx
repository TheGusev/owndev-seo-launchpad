import { Card } from "@/components/ui/Card";
import { copy } from "@/content/copy";
import { solutions, type Solution } from "@/data/solutionsData";

const iconMap: Record<Solution["icon"], JSX.Element> = {
  game: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M15 10v4M13 12h4" />
    </svg>
  ),
  betting: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  ),
  payment: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
  affiliate: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <path d="M12 8v4M8.5 16.5l2-3M15.5 16.5l-2-3" />
    </svg>
  ),
  aml: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  analytics: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M18 9l-5 5-4-4-3 3" />
    </svg>
  ),
};

const SolutionsSection = () => {
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

        {/* Solutions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((solution) => (
            <Card 
              key={solution.id}
              as="article"
              className="group flex flex-col"
            >
              {/* Icon */}
              <div className="text-accent mb-4 group-hover:scale-110 transition-transform duration-300">
                {iconMap[solution.icon]}
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
