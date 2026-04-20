import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { getAllLessons } from "@/data/academy/lessons";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { GradientButton } from "@/components/ui/gradient-button";
import { BookOpen, Code, FileText, Rocket, TrendingUp, Clock, Layers, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const moduleIcons = [BookOpen, Code, FileText, Rocket, TrendingUp];
const moduleColors = [
  "text-primary",
  "text-accent",
  "text-secondary",
  "text-warning",
  "text-success",
];

interface Lesson {
  id: string;
  module_number: number;
  lesson_number: number;
  module_slug: string;
  lesson_slug: string;
  module_title: string;
  title: string;
  description: string | null;
  reading_time_minutes: number;
}

interface Module {
  number: number;
  slug: string;
  title: string;
  icon: any;
  color: string;
  lessons: Lesson[];
  totalTime: number;
}

const Academy = () => {
  const navigate = useNavigate();

  const modules = useMemo<Module[]>(() => {
    const all = getAllLessons();
    const grouped: Record<number, Lesson[]> = {};
    all.forEach((l) => {
      if (!grouped[l.module_number]) grouped[l.module_number] = [];
      grouped[l.module_number].push(l);
    });
    return Object.entries(grouped).map(([num, lessons]) => ({
      number: Number(num),
      slug: lessons[0].module_slug,
      title: lessons[0].module_title,
      icon: moduleIcons[(Number(num) - 1) % moduleIcons.length],
      color: moduleColors[(Number(num) - 1) % moduleColors.length],
      lessons,
      totalTime: lessons.reduce((s, l) => s + l.reading_time_minutes, 0),
    }));
  }, []);
  const loading = false;

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalTime = modules.reduce((s, m) => s + m.totalTime, 0);
  const totalHours = Math.round(totalTime / 60);

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "GEO Academy — курс по Generative Engine Optimization",
    description: "Бесплатный курс по GEO-оптимизации: от основ до продвинутых техник попадания в ответы нейросетей.",
    provider: { "@type": "Organization", name: "OWNDEV", url: "https://owndev.ru" },
    numberOfCredits: modules.length,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${totalTime}M`,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>GEO Academy — бесплатный курс по GEO-оптимизации | OWNDEV</title>
        <meta name="description" content="Научитесь попадать в ответы нейросетей. Бесплатный курс по Generative Engine Optimization: 5 модулей, 20 уроков, от основ до монетизации." />
        <link rel="canonical" href="https://owndev.ru/academy" />
        <script type="application/ld+json">{JSON.stringify(courseLd)}</script>
      </Helmet>
      <MouseGradient />
      <Header />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="container max-w-4xl mx-auto px-4 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Бесплатный курс
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
              GEO Academy
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Научитесь попадать в ответы нейросетей. От основ Generative Engine Optimization до продвинутых техник и монетизации.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-8">
              <span className="flex items-center gap-1.5"><Layers className="w-4 h-4" />{modules.length} модулей</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{totalLessons} уроков</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />~{totalHours} часа</span>
            </div>
            {modules.length > 0 && (
              <GradientButton
                size="lg"
                onClick={() => navigate(`/academy/${modules[0].slug}/${modules[0].lessons[0].lesson_slug}`)}
              >
                Начать обучение <ArrowRight className="w-4 h-4 ml-2" />
              </GradientButton>
            )}
          </motion.div>
        </section>

        {/* Module cards */}
        <section className="container max-w-5xl mx-auto px-4">
          {loading ? (
            <div className="grid gap-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="glass rounded-2xl p-6 animate-pulse h-40" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6">
              {modules.map((mod, idx) => {
                const Icon = mod.icon;
                return (
                  <motion.div
                    key={mod.number}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                  >
                    <div className="glass rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 group">
                      <div className="flex items-start gap-5">
                        {/* Module number */}
                        <div className={`text-5xl font-bold font-mono ${mod.color} opacity-30 group-hover:opacity-60 transition-opacity leading-none select-none`}>
                          {mod.number}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className={`w-5 h-5 ${mod.color}`} />
                            <h2 className="text-lg font-bold text-foreground">{mod.title}</h2>
                            <span className="text-xs text-muted-foreground">{mod.lessons.length} урока · {mod.totalTime} мин</span>
                          </div>

                          {/* Progress bar placeholder */}
                          <div className="w-full h-1 bg-muted rounded-full mb-4">
                            <div className="h-1 bg-primary/30 rounded-full" style={{ width: "0%" }} />
                          </div>

                          {/* Lessons list */}
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mod.lessons.map((lesson) => (
                              <li key={lesson.id}>
                                <Link
                                  to={`/academy/${mod.slug}/${lesson.lesson_slug}`}
                                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/item py-1"
                                >
                                  <span className="w-5 h-5 rounded-full border border-border flex items-center justify-center text-[10px] font-mono shrink-0">
                                    {lesson.lesson_number}
                                  </span>
                                  <span className="truncate group-hover/item:text-primary transition-colors">
                                    {lesson.title}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Academy;
