import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { blogPosts } from "@/data/blog";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const renderMarkdown = (content: string) => {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${i}`} className="list-disc list-inside space-y-1 text-muted-foreground mb-4 ml-2">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      flushList();
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(<h3 key={i} className="text-lg font-semibold text-foreground mt-6 mb-3" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(4)) }} />);
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(<h2 key={i} className="text-xl font-bold text-foreground mt-8 mb-4" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(3)) }} />);
    } else if (line.startsWith("- [ ] ")) {
      listItems.push("☐ " + line.slice(6));
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (line.startsWith("> ")) {
      flushList();
      elements.push(
        <blockquote key={i} className="border-l-2 border-primary pl-4 py-2 my-4 bg-muted/30 rounded-r-lg">
          <p className="text-muted-foreground italic text-sm" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
        </blockquote>
      );
    } else if (line.startsWith("```")) {
      flushList();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} className="bg-muted rounded-lg p-4 overflow-x-auto my-4">
          <code className="text-sm font-mono text-foreground">{codeLines.join("\n")}</code>
        </pre>
      );
    } else {
      flushList();
      elements.push(<p key={i} className="text-muted-foreground leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />);
    }

    i++;
  }
  flushList();
  return elements;
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug);

  if (!post) return <Navigate to="/blog" replace />;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://owndev.ru/blog/${post.slug}`,
    },
    author: { "@type": "Organization", name: "OWNDEV", url: "https://owndev.ru" },
    publisher: {
      "@type": "Organization",
      name: "OWNDEV",
      url: "https://owndev.ru",
      logo: { "@type": "ImageObject", url: "https://owndev.ru/favicon.ico" },
    },
  };

  // Related posts: same tags, excluding current
  const relatedPosts = blogPosts
    .filter(p => p.slug !== post.slug && p.tags.some(t => post.tags.includes(t)))
    .slice(0, 3);

  return (
    <>
      <Helmet>
        <title>{post.title} | OWNDEV</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={`https://owndev.ru/blog/${post.slug}`} />
        <meta property="og:title" content={`${post.title} | OWNDEV`} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={`https://owndev.ru/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background overflow-hidden">
        <MouseGradient />
        <ClickRipple />
        <Header />
        <main className="pt-24 pb-16 relative">
          {/* Background animations */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatedGrid theme="accent" lineCount={{ h: 3, v: 5 }} />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
          </div>

          <div className="container px-4 md:px-6 relative z-10">
            <article className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Link to="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm min-h-[44px] py-2">
                  <ArrowLeft className="w-4 h-4" /> Назад к блогу
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span>{new Date(post.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime} мин чтения</span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{post.title}</h1>

                <div className="flex gap-2 flex-wrap mb-8">
                  {post.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </motion.div>

              <motion.div
                className="prose-custom"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
              >
                {renderMarkdown(post.content)}
              </motion.div>

              {/* Related posts */}
              {relatedPosts.length > 0 && (
                <motion.section
                  className="mt-16 border-t border-border pt-10"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-xl font-bold font-serif mb-6">Похожие статьи</h2>
                  <div className="grid gap-4">
                    {relatedPosts.map(rp => (
                      <Link
                        key={rp.slug}
                        to={`/blog/${rp.slug}`}
                        className="glass rounded-xl p-4 hover:border-primary/40 transition-all group flex items-center gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">{rp.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{rp.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{rp.readTime} мин</span>
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}
            </article>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BlogPost;
