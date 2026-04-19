import { useState } from 'react';
import { Printer, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generateMarketplacePdf, generateMarketplaceWord } from '@/lib/generateMarketplaceReport';
import type { ResultResponse } from '@/lib/marketplace-audit-types';

interface Props {
  result: ResultResponse;
}

export default function MarketplaceDownloadButtons({ result }: Props) {
  const { toast } = useToast();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);

  const handlePdf = async () => {
    try {
      setPdfLoading(true);
      toast({ title: '⏳ Генерируем PDF...', description: 'Создаём отчёт по карточке' });
      await generateMarketplacePdf(result);
      toast({ title: '✅ PDF готов!', description: 'Файл сохранён на устройство' });
    } catch (e) {
      console.error('PDF error:', e);
      toast({ title: 'Ошибка PDF', description: 'Попробуйте ещё раз', variant: 'destructive' });
    } finally {
      setPdfLoading(false);
    }
  };

  const handleWord = async () => {
    try {
      setWordLoading(true);
      toast({ title: '⏳ Генерируем Word...', description: 'Создаём DOCX-документ' });
      await generateMarketplaceWord(result);
      toast({ title: '✅ Word готов!', description: 'Файл сохранён на устройство' });
    } catch (e) {
      console.error('Word error:', e);
      toast({ title: 'Ошибка Word', description: 'Попробуйте ещё раз', variant: 'destructive' });
    } finally {
      setWordLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 no-print">
      <Button
        variant="outline"
        className="gap-2 min-h-[44px]"
        onClick={handlePdf}
        disabled={pdfLoading}
      >
        {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
        {pdfLoading ? 'Генерируем...' : 'PDF-отчёт'}
      </Button>
      <Button
        variant="outline"
        className="gap-2 min-h-[44px]"
        onClick={handleWord}
        disabled={wordLoading}
      >
        {wordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        {wordLoading ? 'Генерируем...' : 'Word-отчёт'}
      </Button>
    </div>
  );
}
