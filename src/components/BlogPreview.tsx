import { Link } from "react-router-dom";
import { blogPosts } from "@/data/blog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { motion } from "framer-motion";

const BlogPreview = () => {
  const latestPosts = blogPosts.slice(0, 3);

  return (
    <section className="py-10 md:py-24">
      <div className="container px-4 md:px-6">
        <motion.div
          className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-6 md:mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Блог</h2>
            <p className="text-muted-foreground mt-2">Гайды по GEO, LLM Score и AI‑ready SEO</p>
          </div>
          <Link to="/blog">
            <GradientButton variant="variant" size="sm">
              Все статьи <ArrowRight className="w-4 h-4 ml-1" />
            </GradientButton>
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {latestPosts.map((post, idx) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <Link to={`/blog/${post.slug}`}>
                <Card className="group hover:border-primary/50 transition-all duration-300 bg-card h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span>{new Date(post.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readTime} мин</span>
                    </div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1 line-clamp-2">{post.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1.5 flex-wrap">
                      {post.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
