import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FileType, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { FullReportPayload } from '@/lib/api/siteFormula';
import { generateSiteFormulaPdf } from '@/lib/generateSiteFormulaPdf';
import { generateSiteFormulaWord } from '@/lib/generateSiteFormulaWord';

interface Props {
  report: FullReportPayload;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BlueprintExportButtons({ report }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [wordLoading, setWordLoading] = useState(false);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      const blob = await generateSiteFormulaPdf(report);
      downloadBlob(blob, `site-formula-blueprint-${report.project_class}.pdf`);
      toast.success('PDF готов');
    } catch (e: any) {
      toast.error(`Ошибка PDF: ${e.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleWord = async () => {
    setWordLoading(true);
    try {
      const blob = await generateSiteFormulaWord(report);
      downloadBlob(blob, `site-formula-blueprint-${report.project_class}.docx`);
      toast.success('Word готов');
    } catch (e: any) {
      toast.error(`Ошибка Word: ${e.message}`);
    } finally {
      setWordLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button onClick={handlePdf} disabled={pdfLoading} variant="outline" className="gap-2">
        {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        Скачать PDF
      </Button>
      <Button onClick={handleWord} disabled={wordLoading} variant="outline" className="gap-2">
        {wordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileType className="h-4 w-4" />}
        Скачать Word
      </Button>
    </div>
  );
}
