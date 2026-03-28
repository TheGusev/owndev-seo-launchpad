import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
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

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/offer" element={<Offer />} />
            <Route path="/refund" element={<Refund />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/site-check" element={<SiteCheck />} />
            <Route path="/tools/site-check/result/:scanId" element={<SiteCheckResult />} />
            <Route path="/tools/site-check/report/:reportId" element={<SiteCheckReport />} />
            <Route path="/tools/:toolSlug" element={<ToolPage />} />
            <Route path="/tools/:toolSlug/:regionSlug" element={<GeoToolPage />} />
            <Route path="/:citySlug/:nicheSlug/:toolSlug" element={<GeoNicheToolPage />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
