import { Button } from "@/components/ui/Button";
import { copy } from "@/content/copy";

const WorldSection = () => {
  return (
    <section 
      id="world" 
      className="relative py-24 md:py-32 overflow-hidden"
      aria-labelledby="world-title"
    >
      {/* Background container - ready for globe/map visualization */}
      <div 
        className="absolute inset-0 -z-10"
        aria-hidden="true"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-card/50 to-background" />
        
        {/* Globe placeholder - radial gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 via-accent/5 to-transparent blur-2xl" />
          <div className="absolute inset-[20%] rounded-full border border-accent/10" />
          <div className="absolute inset-[35%] rounded-full border border-accent/10" />
          <div className="absolute inset-[50%] rounded-full border border-accent/10" />
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 text-center relative z-10">
        <h2 
          id="world-title"
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6"
        >
          {copy.world.title}
        </h2>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          {copy.world.subtitle}
        </p>
        
        <Button size="lg" ariaLabel={copy.world.cta}>
          {copy.world.cta}
        </Button>
      </div>
    </section>
  );
};

export default WorldSection;
