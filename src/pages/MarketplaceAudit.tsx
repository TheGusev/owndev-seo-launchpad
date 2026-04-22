import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { startAudit } from '@/lib/api/marketplaceAudit';
import { toast } from 'sonner';
import { ShoppingBag, Loader2 } from 'lucide-react';
import type { MarketplacePlatform, MarketplaceInputType } from '@/lib/marketplace-audit-types';

export default function MarketplaceAudit() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<MarketplacePlatform>('wb');
  const [mode, setMode] = useState<MarketplaceInputType>('url');
  const [value, setValue] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualSpecs, setManualSpecs] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload: any = { platform, inputType: mode, value: mode === 'manual' ? 'manual' : value.trim() };
      if (mode === 'manual') {
        const specs: Record<string, string> = {};
        manualSpecs.split('\n').forEach((line) => {
          const [k, ...rest] = line.split(':');
          if (k && rest.length) specs[k.trim()] = rest.join(':').trim();
        });
        payload.manual = {
          title: manualTitle.trim(),
          description: manualDesc.trim(),
          category: manualCategory.trim(),
          specs,
        };
        if (!payload.manual.title) {
          toast.error('Укажите заголовок карточки');
          setSubmitting(false);
          return;
        }
      } else if (!value.trim()) {
        toast.error('Введите ссылку или артикул');
        setSubmitting(false);
        return;
      }
      const res = await startAudit(payload);
      navigate(`/marketplace-audit/result/${res.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? 'Не удалось запустить аудит');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Аудит карточек Wildberries и Ozon — OWNDEV</title>
        <meta
          name="description"
          content="Бесплатный AI-аудит карточек товара на Wildberries и Ozon: оценка контента, поиска, конверсии и готовности к рекламе."
        />
      </Helmet>
      <Header />
      <main className="container px-4 md:px-6 py-12 md:py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex p-3 rounded-2xl bg-primary/10 mb-4">
            <ShoppingBag className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 font-serif">
            Аудит карточек <span className="text-gradient">WB и Ozon</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Узнайте, что мешает карточке расти. Оценка контента, поиска, конверсии и готовности к рекламе за 30 секунд.
          </p>
        </div>

        <Card className="p-6 md:p-8 glass">
          <div className="mb-6">
            <Label className="mb-3 block">Площадка</Label>
            <div className="flex w-full max-w-sm mx-auto rounded-xl border border-border/60 p-1.5 bg-muted/40 gap-1.5">
              {(['wb', 'ozon'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`flex-1 px-5 py-2.5 rounded-lg text-sm font-medium border border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    platform === p
                      ? 'bg-primary text-primary-foreground border-primary/40 shadow-[0_0_18px_hsl(var(--primary)/0.35)] font-semibold'
                      : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                  }`}
                >
                  {p === 'wb' ? 'Wildberries' : 'Ozon'}
                </button>
              ))}
            </div>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as MarketplaceInputType)}>
            <TabsList className="grid grid-cols-3 w-full h-auto gap-1.5 p-1.5 bg-muted/40 border border-border/60 rounded-xl">
              {(['url', 'sku', 'manual'] as const).map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="py-3 px-3 whitespace-normal text-xs sm:text-sm font-medium rounded-lg text-muted-foreground border border-transparent transition-all duration-200 hover:bg-card/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary/40 data-[state=active]:shadow-[0_0_18px_hsl(var(--primary)/0.35)] data-[state=active]:font-semibold"
                >
                  {tab === 'url' ? 'Ссылка' : tab === 'sku' ? 'Артикул' : 'Вручную'}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="url" className="mt-6">
              <Label htmlFor="url-input">Ссылка на карточку</Label>
              <Input
                id="url-input"
                placeholder={platform === 'wb' ? 'https://www.wildberries.ru/catalog/12345678/detail.aspx' : 'https://www.ozon.ru/product/...'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-2"
              />
            </TabsContent>

            <TabsContent value="sku" className="mt-6">
              <Label htmlFor="sku-input">Артикул товара</Label>
              <Input
                id="sku-input"
                placeholder="Например: 12345678"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-2"
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-6 space-y-4">
              <div>
                <Label htmlFor="m-title">Заголовок карточки *</Label>
                <Input id="m-title" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="m-cat">Категория</Label>
                <Input id="m-cat" placeholder="Например: Куртки мужские" value={manualCategory} onChange={(e) => setManualCategory(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="m-desc">Описание</Label>
                <Textarea id="m-desc" rows={5} value={manualDesc} onChange={(e) => setManualDesc(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="m-specs">Характеристики (по одной на строку, формат «название: значение»)</Label>
                <Textarea
                  id="m-specs"
                  rows={4}
                  placeholder={'Бренд: OWNDEV\nМатериал: Хлопок\nЦвет: Чёрный'}
                  value={manualSpecs}
                  onChange={(e) => setManualSpecs(e.target.value)}
                  className="mt-2"
                />
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleSubmit} disabled={submitting} size="lg" className="w-full mt-6">
            {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Проверить карточку за 30 секунд
          </Button>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            Бесплатно • Без регистрации • Данные не сохраняются для других продавцов
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
