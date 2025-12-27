import { Button } from "@/components/ui/Button";
import { copy } from "@/content/copy";

const Hero = () => {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Video background container - ready for v4 */}
      <div 
        className="absolute inset-0 -z-20"
        aria-hidden="true"
      >
        {/* Placeholder: will be replaced with <video> in v4 */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-background" />
      </div>

      {/* Background effects layer */}
      <div 
        className="absolute inset-0 -z-10"
        aria-hidden="true"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent" />
        
        {/* Radial glow - primary */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
        
        {/* Radial glow - secondary */}
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl" />
        
        {/* Grid pattern placeholder */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 text-center">
        <h1 
          id="hero-title"
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 max-w-4xl mx-auto leading-tight"
        >
          {copy.hero.title}
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          {copy.hero.subtitle}
        </p>
        
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" ariaLabel={copy.hero.cta}>
            {copy.hero.cta}
          </Button>
          <Button variant="outline" size="lg" ariaLabel="Смотреть решения">
            Смотреть решения
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
