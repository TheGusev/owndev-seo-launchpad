import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ymHit } from "@/utils/analytics";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Tools from "./pages/Tools";
import ToolPage from "./pages/ToolPage";
import GeoToolPage from "./pages/GeoToolPage";
import GeoNicheToolPage from "./pages/GeoNicheToolPage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import CookieBanner from "./components/CookieBanner";
import ScrollToTop from "./components/ScrollToTop";
import SiteCheck from "./pages/SiteCheck";
import SiteCheckResult from "./pages/SiteCheckResult";
import SiteCheckReport from "./pages/SiteCheckReport";
import Offer from "./pages/Offer";
import Refund from "./pages/Refund";
import Contacts from "./pages/Contacts";
import GeoAudit from "./pages/GeoAudit";
import GeoRating from "./pages/GeoRating";
import Academy from "./pages/Academy";
import AcademyLesson from "./pages/AcademyLesson";
import AiVisibility from "./pages/scenarios/AiVisibility";
import AiReadyContent from "./pages/scenarios/AiReadyContent";
import BrandPresence from "./pages/scenarios/BrandPresence";
import Monitoring from "./pages/scenarios/Monitoring";
import BorderBot from "@/components/mascot/BorderBot";
import { AuditProvider } from "@/state/audit";

const queryClient = new QueryClient();

const RouteTracker = () => {
  const location = useLocation();
  useEffect(() => {
    ymHit(location.pathname + location.search);
  }, [location]);
  return null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuditProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <RouteTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/offer" element={<Offer />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/geo-audit" element={<GeoAudit />} />
            <Route path="/geo-rating" element={<GeoRating />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/site-check" element={<SiteCheck />} />
            <Route path="/academy" element={<Academy />} />
            <Route path="/academy/:moduleSlug/:lessonSlug" element={<AcademyLesson />} />
            <Route path="/tools/site-check/result/:scanId" element={<ErrorBoundary><SiteCheckResult /></ErrorBoundary>} />
            <Route path="/tools/site-check/report/:reportId" element={<ErrorBoundary><SiteCheckReport /></ErrorBoundary>} />
            <Route path="/tools/:toolSlug" element={<ToolPage />} />
            <Route path="/tools/:toolSlug/:regionSlug" element={<GeoToolPage />} />
            <Route path="/:citySlug/:nicheSlug/:toolSlug" element={<GeoNicheToolPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/scenario/ai-visibility" element={<AiVisibility />} />
            <Route path="/scenario/ai-ready-content" element={<AiReadyContent />} />
            <Route path="/scenario/brand-presence" element={<BrandPresence />} />
            <Route path="/scenario/monitoring" element={<Monitoring />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
          <BorderBot />
        </BrowserRouter>
      </TooltipProvider>
      </AuditProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
