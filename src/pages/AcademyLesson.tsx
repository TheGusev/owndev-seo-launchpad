import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { GradientButton } from "@/components/ui/gradient-button";
import { ArrowLeft, ArrowRight, Clock, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface Lesson {
  id: string;
  module_number: number;
  lesson_number: number;
  module_slug: string;
  lesson_slug: string;
  module_title: string;
  title: string;
  description: string | null;
  content: string;
  reading_time_minutes: number;
}

const AcademyLesson = () => {
  const { moduleSlug, lessonSlug } = useParams<{ moduleSlug: string; lessonSlug: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [moduleLessons, setModuleLessons] = useState<Lesson[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: all } = await supabase
        .from("academy_lessons")
        .select("*")
        .order("module_number")
        .order("lesson_number");

      if (!all) { setLoading(false); return; }

      const typed = all as any as Lesson[];
      setAllLessons(typed);
      setModuleLessons(typed.filter(l => l.module_slug === moduleSlug));
      setLesson(typed.find(l => l.module_slug === moduleSlug && l.lesson_slug === lessonSlug) || null);
      setLoading(false);
    };
    load();
  }, [moduleSlug, lessonSlug]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!lesson) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Урок не найден</h1>
            <Link to="/academy" className="text-primary">← Вернуться в Academy</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Find prev/next across ALL lessons
  const flatIdx = allLessons.findIndex(l => l.id === lesson.id);
  const prevLesson = flatIdx > 0 ? allLessons[flatIdx - 1] : null;
  const nextLesson = flatIdx < allLessons.length - 1 ? allLessons[flatIdx + 1] : null;

  const lessonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.description || "",
    learningResourceType: "lesson",
    isPartOf: {
      "@type": "Course",
      name: `GEO Academy — ${lesson.module_title}`,
      provider: { "@type": "Organization", name: "OWNDEV" },
    },
    timeRequired: `PT${lesson.reading_time_minutes}M`,
  };

  return (
    <>
      <Helmet>
        <title>{lesson.title} — GEO Academy | OWNDEV</title>
        <meta name="description" content={lesson.description || `Урок ${lesson.lesson_number}: ${lesson.title}`} />
        <link rel="canonical" href={`https://owndev.ru/academy/${moduleSlug}/${lessonSlug}`} />
        <script type="application/ld+json">{JSON.stringify(lessonLd)}</script>
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex gap-8">
            {/* Sidebar — desktop only */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-24 space-y-1">
                <Link to="/academy" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
                  <ArrowLeft className="w-3.5 h-3.5" /> Все модули
                </Link>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Модуль {lesson.module_number}: {lesson.module_title}
                </h3>
                {moduleLessons.map((l) => (
                  <Link
                    key={l.id}
                    to={`/academy/${l.module_slug}/${l.lesson_slug}`}
                    className={`flex items-center gap-2 text-sm py-2 px-3 rounded-lg transition-colors ${
                      l.id === lesson.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full border border-current/30 flex items-center justify-center text-[10px] font-mono shrink-0">
                      {l.lesson_number}
                    </span>
                    <span className="truncate">{l.title}</span>
                  </Link>
                ))}
              </div>
            </aside>

            {/* Content */}
            <motion.article
              className="flex-1 max-w-[720px]"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Breadcrumb - mobile */}
              <div className="lg:hidden mb-4">
                <Link to="/academy" className="text-sm text-muted-foreground hover:text-foreground">
                  ← Academy
                </Link>
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                <span>Модуль {lesson.module_number}</span>
                <span>·</span>
                <span>Урок {lesson.lesson_number}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{lesson.reading_time_minutes} мин</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
                {lesson.title}
              </h1>

              {lesson.description && (
                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                  {lesson.description}
                </p>
              )}

              {/* Content */}
              <div className="glass rounded-2xl p-6 md:p-8 mb-8">
                <div className="prose prose-invert max-w-none text-foreground leading-relaxed">
                  {lesson.content === "Контент готовится..." ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg">Контент этого урока готовится</p>
                      <p className="text-sm text-muted-foreground/70 mt-2">Скоро здесь появится полный материал урока</p>
                    </div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br/>') }} />
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-4 mb-8">
                {prevLesson ? (
                  <Link
                    to={`/academy/${prevLesson.module_slug}/${prevLesson.lesson_slug}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">{prevLesson.title}</span>
                    <span className="sm:hidden">Назад</span>
                  </Link>
                ) : <div />}
                {nextLesson ? (
                  <Link
                    to={`/academy/${nextLesson.module_slug}/${nextLesson.lesson_slug}`}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                  >
                    <span className="hidden sm:inline">{nextLesson.title}</span>
                    <span className="sm:hidden">Далее</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : <div />}
              </div>

              {/* CTA */}
              <div className="glass rounded-xl p-6 text-center">
                <p className="text-foreground font-medium mb-3">Проверьте свой сайт прямо сейчас</p>
                <GradientButton size="sm" onClick={() => navigate("/tools/site-check")}>
                  Запустить GEO-аудит на OWNDEV →
                </GradientButton>
              </div>
            </motion.article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default AcademyLesson;
