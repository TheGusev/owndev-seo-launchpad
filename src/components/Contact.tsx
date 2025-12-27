import { Button } from "@/components/ui/button";

const Contact = () => {
  return (
    <section id="contact" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Готовы начать проект?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Свяжитесь с нами, и мы обсудим вашу идею
          </p>
          <Button size="lg">Получить консультацию</Button>
        </div>
      </div>
    </section>
  );
};

export default Contact;
