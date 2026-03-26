import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScanForm from "@/components/site-check/ScanForm";
import ScanProgress from "@/components/site-check/ScanProgress";
import { createMockScan } from "@/lib/site-check-mock";
import type { ScanMode } from "@/lib/site-check-types";
import { Check, Lock } from "lucide-react";

const checkItems = [
  { text: "Технический SEO (скорость, код, robots, sitemap)", free: true },
  { text: "Заголовки, Title, H1, контент", free: true },
  { text: "Готовность к Яндекс.Директ и автотаргетингу", free: true },
  { text: "Schema.org и AI-видимость", free: true },
  { text: "Сравнение с топ-10 конкурентами", free: false },
  { text: "200+ ключевых запросов", free: false },
  { text: "Минус-слова для Директа", free: false },
];

const SiteCheck = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanUrl, setScanUrl] = useState("");
  const [scanMode, setScanMode] = useState<ScanMode>("page");

  const handleSubmit = (url: string, mode: ScanMode) => {
    setScanUrl(url);
    setScanMode(mode);
    setScanning(true);
  };

  const handleScanComplete = useCallback(() => {
    const scan = createMockScan(scanUrl, scanMode);
    // In production this would save to DB; for now store in sessionStorage
    sessionStorage.setItem(`scan_${scan.scan_id}`, JSON.stringify(scan));
    navigate(`/tools/site-check/result/${scan.scan_id}`);
  }, [scanUrl, scanMode, navigate]);

  return (
    <>
      <Helmet>
        <title>Проверка сайта — SEO, Директ, конкуренты | OwnDev</title>
        <meta name="description" content="Бесплатная проверка сайта: SEO, готовность к Яндекс.Директ, Schema.org, AI-видимость. Полный отчёт с ключевыми запросами и конкурентами." />
      </Helmet>
      <Header />
      <main className="min-h-screen pt-24 pb-16">
        <div className="container max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Проверка сайта
            </h1>
            <p className="text-muted-foreground mt-3 text-base">
              SEO, Яндекс.Директ, конкуренты и ключевые запросы — в одном отчёте
            </p>
          </div>

          <div className="glass rounded-2xl p-5 md:p-8">
            {scanning ? (
              <ScanProgress onComplete={handleScanComplete} />
            ) : (
              <ScanForm onSubmit={handleSubmit} />
            )}
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Что проверяем</h2>
            <ul className="space-y-3">
              {checkItems.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  {item.free ? (
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.free ? "text-foreground" : "text-muted-foreground"}>
                    {item.text}
                  </span>
                  {!item.free && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
                      полный отчёт
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default SiteCheck;
