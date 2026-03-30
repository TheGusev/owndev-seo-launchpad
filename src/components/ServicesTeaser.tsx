import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Code2, Sparkles, Bot } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { useNavigate, useLocation } from "react-router-dom";

const services = [
  { icon: Code2, text: "SEO Score — классический технический аудит" },
  { icon: Sparkles, text: "LLM Score — готовность к AI‑выдаче" },
  { icon: Bot, text: "llms.txt — инструкция для AI‑краулеров" },
];

const ServicesTeaser = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const navigate = useNavigate();
  const location = useLocation();

  const handleContact = () => {
    if (location.pathname !== "/") {
      navigate("/#contact");
      setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 400);
    } else {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-8 md:py-16 relative">
      <div className="container px-4 md:px-6 max-w-2xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-6 md:p-8 text-center"
        >
          <h2 className="text-xl md:text-2xl font-bold mb-3 font-serif">
            Почему двойной аудит?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Классическое SEO уже недостаточно. OWNDEV проверяет сайт по двум слоям — SEO и AI‑готовность — в одном отчёте.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            {services.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                <s.icon className="w-4 h-4 text-primary shrink-0" />
                <span>{s.text}</span>
              </div>
            ))}
          </div>

          <GradientButton variant="variant" size="sm" onClick={() => navigate("/tools/site-check")}>
            Запустить GEO‑аудит
          </GradientButton>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesTeaser;
