interface ScanData {
  url: string;
  theme?: string;
  keywords?: Array<{ keyword: string; intent?: string }> | any[];
}

export function generateLlmsTxt(data: ScanData): string {
  const lines: string[] = [];
  
  lines.push(`# ${data.url}`);
  if (data.theme) {
    lines.push(`> ${data.theme}`);
  }
  lines.push('');

  // Keywords as "Offered"
  const keywords = Array.isArray(data.keywords) ? data.keywords : [];
  if (keywords.length > 0) {
    lines.push('## Offered');
    const keywordTexts = keywords
      .slice(0, 20)
      .map(k => typeof k === 'string' ? k : k.keyword || k.text || String(k))
      .filter(Boolean);
    for (const kw of keywordTexts) {
      lines.push(`- ${kw}`);
    }
    lines.push('');
  }

  lines.push('## Links');
  lines.push(`- ${data.url}: Главная страница`);
  lines.push('');

  return lines.join('\n');
}

export function downloadLlmsTxt(data: ScanData): void {
  const content = generateLlmsTxt(data);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'llms.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
