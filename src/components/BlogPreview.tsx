import { Link } from "react-router-dom";
import { blogPosts } from "@/data/blog-posts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

const BlogPreview = () => {
  const latestPosts = blogPosts.slice(0, 3);

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Блог</h2>
            <p className="text-muted-foreground mt-2">Гайды по LLM-оптимизации и pSEO</p>
          </div>
          <Link to="/blog">
            <GradientButton variant="outline" size="sm">
              Все статьи <ArrowRight className="w-4 h-4 ml-1" />
            </GradientButton>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {latestPosts.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`}>
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
