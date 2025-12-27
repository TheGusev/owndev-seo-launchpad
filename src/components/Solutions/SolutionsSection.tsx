import { Card } from "@/components/ui/Card";
import { copy } from "@/content/copy";
import { solutions, type Solution } from "@/data/solutionsData";

const iconMap: Record<Solution["icon"], JSX.Element> = {
  web: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  mobile: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12" y2="18" strokeLinecap="round" />
    </svg>
  ),
  automation: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  ai: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
      <path d="M8 14v2a4 4 0 0 0 8 0v-2" />
      <circle cx="12" cy="18" r="4" />
    </svg>
  ),
  cloud: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
    </svg>
  ),
  consulting: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
              className="group"
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
              <p className="text-muted-foreground leading-relaxed">
                {solution.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionsSection;
