import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/tools" element={<Tools />} />
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
