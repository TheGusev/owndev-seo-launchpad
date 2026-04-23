export const strings = {
  ru: {
    siteCheckResult: {
      llmsTxt: {
        foundBadge: 'llms.txt найден на сайте — проверка пройдена ✓',
        generateButton: 'Сгенерировать llms.txt для вашего сайта',
        notFoundHint: 'На вашем сайте файл не найден — создайте по стандарту llmstxt.org',
      },
    },
  },
} as const;

export type Lang = keyof typeof strings;
const DEFAULT_LANG: Lang = 'ru';

export function t(path: string, vars?: Record<string, string>, lang: Lang = DEFAULT_LANG): string {
  const value = path.split('.').reduce<any>((acc, key) => (acc ? acc[key] : undefined), strings[lang]);
  if (typeof value !== 'string') return path;
  return vars ? value.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`) : value;
}