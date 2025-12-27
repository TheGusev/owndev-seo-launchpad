import { Button } from "@/components/ui/Button";
import { copy } from "@/content/copy";

const CTASection = () => {
  return (
    <section 
      id="contact" 
      className="py-24 md:py-32"
      aria-labelledby="cta-title"
    >
      <div className="container mx-auto px-6">
        <div className="glass rounded-2xl p-8 md:p-16 text-center max-w-3xl mx-auto">
          <h2 
            id="cta-title"
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            {copy.cta.title}
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            {copy.cta.subtitle}
          </p>
          
          <Button size="lg" ariaLabel={copy.cta.button}>
            {copy.cta.button}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
