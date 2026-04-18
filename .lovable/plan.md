

## План: фикс "Invalid URL" + защита worker от мусорного ввода

### Что произошло — анализ логов

```
2026-04-18T18:31:55Z Scan failed: Invalid URL
2026-04-18T18:32:17Z Scan failed: Invalid URL
URL: https://СЭС -изи.рф (с пробелом и кириллицей)
```

Билд бэка прошёл, рестарт ок, новые сканы стартуют. Но кто-то (возможно бот или сам пользователь) вбил `СЭС -изи.рф`. Frontend `ensureProtocol()` просто добавил `https://`, не закодировав пробелы и не сконвертировав кириллицу в punycode. Backend получил `https://СЭС -изи.рф` → `new URL()` падает с `Invalid URL` → 10 сканов подряд упали + `geo_rating upsert failed`.

### Root causes (3 шт.)

**1. Frontend `ensureProtocol()` не нормализует URL** — пропускает пробелы и кириллические домены без конверсии в IDN/punycode. Backend потом падает.

**2. Backend `siteCheck.ts /start`** — принимает `url` без валидации. Если URL невалиден, всё равно ставит в очередь → worker падает на `new URL()`.

**3. Worker `SiteCheckWorker.ts`** — при упавшем сканe `geo_rating upsert` тоже падает (потому что `new URL(url).hostname` бросает) и логирует ошибку, но это уже followup.

### Фикс (3 точечных правки)

#### A. Frontend — `src/lib/api/tools.ts` 

Расширить `ensureProtocol()`: trim, replace всех whitespace, конверсия кириллицы в punycode через `URL` API (браузер сам конвертирует hostname в `xn--...`):

```ts
export function ensureProtocol(url: string): string {
  let trimmed = url.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`;
  try {
    const parsed = new URL(trimmed);
    // hostname в браузере автоматически конвертируется в IDN/punycode
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return trimmed; // fallback — пусть backend отобьёт с понятной ошибкой
  }
}
```

#### B. Backend — `owndev-backend/src/api/routes/siteCheck.ts /start`

Перед `INSERT` валидировать URL и нормализовать через существующий `normalizeUrl()` из `utils/url.ts`. Если невалиден — 400, не ставим в очередь:

```ts
import { isValidUrl, normalizeUrl } from '../../utils/url.js';

// внутри handler:
let normalizedUrl: string;
try {
  normalizedUrl = normalizeUrl(url);
  if (!isValidUrl(normalizedUrl)) throw new Error();
} catch {
  return reply.status(400).send({
    success: false,
    error: 'Некорректный URL. Проверьте написание адреса.',
  });
}
// дальше используем normalizedUrl вместо url
```

#### C. Backend worker — `owndev-backend/src/workers/SiteCheckWorker.ts`

Обернуть `new URL(url).hostname` в try/catch чтобы `geo_rating upsert` не валился если URL по какой-то причине всё-таки невалидный:

```ts
let hostname: string | null = null;
try { hostname = new URL(url).hostname; } catch { hostname = null; }
if (hostname) {
  // существующий upsert
}
```

### Что НЕ ломаем

- Все остальные tools (SEOAuditor, IndexationChecker и т.д.) тоже выиграют — они используют тот же `ensureProtocol()`.
- API контракт `/start` совместимый: добавляется только 400 на мусор, валидные URL работают как раньше.
- `normalizeUrl` уже существует в `utils/url.ts`, ничего нового не пишем.
- Site Formula, engine, миграции — не трогаем.

### Команда деплоя

```bash
cd /var/www/owndev.ru && git pull origin main && \
cd /var/www/owndev.ru/owndev-backend && npm run build && pm2 restart owndev-backend && \
cd /var/www/owndev.ru && npm run build && \
pm2 status && pm2 logs owndev-backend --lines 30 --nostream
```

### Изменяемые файлы

- ✏️ `src/lib/api/tools.ts` — расширить `ensureProtocol`
- ✏️ `owndev-backend/src/api/routes/siteCheck.ts` — валидация в `/start`
- ✏️ `owndev-backend/src/workers/SiteCheckWorker.ts` — защита `geo_rating upsert`

### Self-check

- ✅ Root cause: `Invalid URL` из-за `https://СЭС -изи.рф` с пробелом + кириллицей
- ✅ 3 уровня защиты: фронт нормализует → бэк валидирует → worker устойчив к ошибкам
- ✅ Никаких изменений в Site Formula, edge functions, миграциях
- ✅ После фикса исчезнут оба типа ошибок: `Scan failed: Invalid URL` и `geo_rating upsert failed: Invalid URL`
- ✅ Site Formula POST-фиксы из прошлых раундов уже задеплоены (`Body cannot be empty` записи в логах от 16-18 апр — до релиза)

