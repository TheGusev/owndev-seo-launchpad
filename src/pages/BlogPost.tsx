import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { blogPosts } from "@/data/blog-posts";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock } from "lucide-react";

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
    author: { "@type": "Organization", name: "OWNDEV" },
  };

  return (
    <>
      <Helmet>
        <title>{post.title} | OWNDEV</title>
        <meta name="description" content={post.description} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="container px-4 md:px-6 pt-24 pb-16">
          <article className="max-w-3xl mx-auto">
            <Link to="/blog" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm min-h-[44px] py-2">
              <ArrowLeft className="w-4 h-4" /> Назад к блогу
            </Link>

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

            <div className="prose-custom">
              {renderMarkdown(post.content)}
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default BlogPost;
