import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { blogPosts, getAllTags } from "@/data/blog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";
import DefaultBlogCover from "@/components/blog/DefaultBlogCover";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const Blog = () => {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const allTags = getAllTags();

  const filtered = blogPosts.filter(post => {
    const matchesSearch = !search || 
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || post.tags.includes(activeTag);
    return matchesSearch && matchesTag;
  });

  return (
    <>
      <Helmet>
        <title>Блог OWNDEV — GEO, AI-ready SEO и оптимизация для нейросетей</title>
        <meta name="description" content="Статьи о GEO, LLM Score, AI-ready аудите, llms.txt и новом стандарте SEO для ChatGPT и Яндекс Нейро." />
        <link rel="canonical" href="https://owndev.ru/blog" />
        <meta property="og:title" content="Блог OWNDEV — GEO, AI-ready SEO и оптимизация для нейросетей" />
        <meta property="og:description" content="Статьи о GEO, LLM Score, AI-ready аудите, llms.txt и новом стандарте SEO для ChatGPT и Яндекс Нейро." />
        <meta property="og:url" content="https://owndev.ru/blog" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://owndev.ru/" },
            { "@type": "ListItem", position: 2, name: "Блог", item: "https://owndev.ru/blog" },
          ],
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background overflow-hidden">
        <MouseGradient />
        <ClickRipple />
        <Header />
        <main className="pt-20 pb-12 md:pt-24 md:pb-16 relative">
          <div className="absolute inset-0 pointer-events-none">
            <AnimatedGrid theme="secondary" lineCount={{ h: 4, v: 6 }} />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <div className="max-w-6xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Блог о GEO и AI‑ready SEO</h1>
                <p className="text-muted-foreground text-lg mb-8">
                  Первые в Рунете пишем о GEO, LLM Score и оптимизации для нейросетей
                </p>
              </motion.div>

              <motion.div
                className="mb-8 space-y-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск статей..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setActiveTag(null)}
                    className={`text-xs px-3 py-2 rounded-full border transition-colors min-h-[36px] ${
                      !activeTag ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    Все
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                      className={`text-xs px-3 py-2 rounded-full border transition-colors min-h-[36px] ${
                        activeTag === tag ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-6">
                {filtered.slice(0, visibleCount).map((post, idx) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                  >
                    <Link to={`/blog/${post.slug}`}>
                      <Card className="group hover:border-primary/50 transition-all duration-300 bg-card h-full flex flex-col">
                        <CardHeader className="flex-1">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                            <span>{new Date(post.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime} мин</span>
                          </div>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {post.title}
                          </CardTitle>
                          <CardDescription className="text-sm mt-2">{post.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 flex-wrap">
                              {post.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
                {filtered.length === 0 && (
                  <p className="text-muted-foreground text-center py-12 md:col-span-2">Ничего не найдено</p>
                )}
              </div>
              {filtered.length > visibleCount && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 12)}
                    className="px-6 py-3 rounded-lg border border-border text-foreground hover:border-primary/50 hover:text-primary transition-colors text-sm font-medium"
                  >
                    Показать ещё ({filtered.length - visibleCount})
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Blog;
