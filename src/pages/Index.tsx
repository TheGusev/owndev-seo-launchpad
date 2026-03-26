import { Helmet } from "react-helmet-async";
import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ServicesTeaser from "@/components/ServicesTeaser";
import ToolsShowcase from "@/components/ToolsShowcase";
import Footer from "@/components/Footer";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";

const FAQ = lazy(() => import("@/components/FAQ"));
const ContactForm = lazy(() => import("@/components/ContactForm"));
const BlogPreview = lazy(() => import("@/components/BlogPreview"));

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OWNDEV",
  url: "https://owndev.ru",
  logo: "https://owndev.ru/favicon.ico",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+7-906-998-98-88",
    contactType: "customer service",
    availableLanguage: "Russian",
  },
  sameAs: ["https://t.me/The_Suppor_t"],
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "OWNDEV",
  url: "https://owndev.ru",
  description: "Бесплатные SEO + LLM инструменты для сайтов и pSEO",
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth snap-container">
      <Helmet>
        <title>OWNDEV — SEO оптимизация и разработка SaaS решений</title>
        <meta name="description" content="OWNDEV — профессиональная SEO оптимизация и разработка SaaS сайтов, платформ и приложений. Вывод в ТОП-10, создание цифровых продуктов под ключ." />
        <link rel="canonical" href="https://owndev.ru/" />
        <script type="application/ld+json">{JSON.stringify(organizationLd)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteLd)}</script>
      </Helmet>
      <MouseGradient />
      <ClickRipple />
      
      <Header />
      <main>
        <Hero />
        <ServicesTeaser />
        <ToolsShowcase />
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <BlogPreview />
        </Suspense>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <FAQ />
        </Suspense>
        <Suspense fallback={<div className="min-h-[200px]" />}>
          <ContactForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
