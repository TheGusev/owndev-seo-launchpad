

## Цель

Добавить экспоненциальный ретрай для всех LLM-вызовов в backend. При 429/500/503 — до 3 попыток с задержками 1s/2s/4s. Если все попытки провалились — текущее поведение сохраняется (вернуть `''`/`null`/пустой массив), а аудит **не падает**.

## Принцип реализации

Текущий код **уже не валит аудит** на ошибках LLM — каждый вызов оборачивает свой `fetch` в `try/catch` и возвращает `''`/`null` при сбое. То есть «дефолтный результат для блока» уже на месте. Не хватает только **ретраев на ретраябельных кодах**, чтобы транзиентные 429/503 не превращались в пустой блок с первой попытки.

Ввести **общую утилиту** `owndev-backend/src/utils/retry.ts` и использовать её во всех LLM-обёртках.

## Файлы и правки

### 1. Новый файл `owndev-backend/src/utils/retry.ts`

```ts
import { logger } from './logger.js';

export interface RetryOptions {
  retries?: number;          // default 3
  baseDelayMs?: number;      // default 1000
  retryOnStatus?: number[];  // default [429, 500, 502, 503, 504]
  label?: string;            // for logs
}

/** Выполняет fn с экспоненциальным backoff. fn должен бросать ошибку с .status для HTTP-кодов. */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const base = opts.baseDelayMs ?? 1000;
  const codes = opts.retryOnStatus ?? [429, 500, 502, 503, 504];
  const label = opts.label ?? 'RETRY';
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status: number | undefined = err?.status;
      const retryable = status !== undefined && codes.includes(status);
      const isLast = i === retries - 1;
      if (!retryable || isLast) throw err;
      const delay = base * Math.pow(2, i); // 1s, 2s, 4s
      logger.warn(label, `attempt ${i + 1}/${retries} failed (status=${status}), retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr ?? new Error('Max retries exceeded');
}

/** Ошибка с HTTP-статусом — чтобы withRetry мог решать ретраить или нет. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}
```

### 2. `owndev-backend/src/services/SiteCheckPipeline.ts`

**Импорт** (после существующих импортов):
```ts
import { withRetry, HttpError } from '../utils/retry.js';
```

**`llmCall` (строки 468–499)** — обернуть тело fetch-блока. Внутри `withRetry` бросаем `HttpError(resp.status)` для 429/5xx, иначе текущая логика. Внешний `try/catch` сохраняем — он ловит финальную ошибку после всех ретраев и возвращает `''` (никаких изменений в контракте).

```ts
async function llmCall(apiKey: string, _model: string, systemPrompt: string, userPrompt: string, maxTokens = 4000, temperature = 0.1): Promise<string> {
  const config = getLlmConfig(apiKey);
  try {
    return await withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);
      try {
        const resp = await fetch(config.url, {
          method: 'POST',
          headers: config.headers,
          signal: controller.signal,
          body: JSON.stringify({
            model: config.defaultModel,
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            max_tokens: maxTokens, temperature, top_p: 0.85,
          }),
        });
        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          if ([429, 500, 502, 503, 504].includes(resp.status)) {
            throw new HttpError(resp.status, errText.slice(0, 300));
          }
          logger.error('PIPELINE', `LLM HTTP ${resp.status} [${LLM_PROVIDER}]: ${errText.slice(0, 300)}`);
          return '';
        }
        const data = await resp.json();
        return data.choices?.[0]?.message?.content?.trim() || '';
      } finally {
        clearTimeout(timeoutId);
      }
    }, { label: 'PIPELINE_LLM' });
  } catch (e: any) {
    if (e?.name === 'AbortError') logger.error('PIPELINE', `LLM TIMEOUT [${LLM_PROVIDER}]`);
    else logger.error('PIPELINE', `LLM failed after retries [${LLM_PROVIDER}]: ${e?.message || e}`);
    return ''; // дефолт — пустой ответ, аудит продолжается
  }
}
```

**`llmToolCall` (строки 501–538)** — аналогично, но возврат при провале — `null` (текущий контракт).

### 3. `owndev-backend/src/api/routes/siteCheck.ts`

Импортировать `withRetry`, `HttpError`. Обернуть две инлайновые fetch-схемы:

- **`queryAiSystem` (строки 466–491)**: внутри `try` использовать `withRetry`. На неретраябельных и после исчерпания — текущий fallback (`{ score: 0, verdict: 'Ошибка анализа', ... }`). Это критично, т.к. `Promise.all(aiSystems.map(...))` уже устойчив к падениям отдельных систем — добавляем только устойчивость к транзиентным 429.

- **`/ai-boost` (строки 571–610)**: оборачиваем `fetch` в `withRetry`. На финальной ошибке оставляем текущий `return reply.status(500).send({ error: 'Не удалось сгенерировать план' })` — это ручка, а не часть основного аудита, валить пайплайн нечем.

Бросаем `new HttpError(resp.status, …)` вместо `throw new Error('OpenAI ${status}')`, чтобы `withRetry` корректно отличал 429/5xx от 4xx.

### 4. `owndev-backend/src/services/Tools/llmCall.ts`

Эта обёртка ходит через `llm-proxy` Edge Function — те же 429/5xx могут прилетать оттуда. Применить `withRetry` вокруг `fetch`:

```ts
const r = await withRetry(async () => {
  const resp = await fetch(PROXY_URL, { /* как сейчас */ });
  if (!resp.ok && [429, 500, 502, 503, 504].includes(resp.status)) {
    throw new HttpError(resp.status, `llm-proxy ${resp.status}`);
  }
  return resp;
}, { label: 'TOOLS_LLM' });
```

Текущая семантика `return null` при не-ok сохраняется; ретраи только для транзиентных кодов.

### 5. `owndev-backend/src/services/MarketplaceAudit/llm/runLlm.ts`

Идентичная обёртка вокруг `fetch(GATEWAY_URL, …)`. Контракт `Promise<T | null>` сохраняется. Это нужно, чтобы воркер маркетплейс-аудита тоже переживал транзиентные 429.

### 6. `owndev-backend/src/api/routes/conversionAudit.ts`

Один вызов `fetch('https://api.openai.com/...')` (строка 118). Обернуть аналогично — на финальной ошибке возврат текущего fallback (без падения роута).

## Что НЕ трогаем

- Edge Functions в `supabase/functions/*` (отдельный рантайм Deno, отдельная задача при необходимости).
- Контракты функций (`llmCall` → `string`, `llmToolCall` → `any|null`, `callJsonLlm` → `T|null`) — НЕ меняются.
- Сигналы таймаута (`AbortController` 45s, `AbortSignal.timeout(30_000/45_000)`) — остаются для каждой попытки отдельно (что и нужно: общий бюджет худшего случая = 3 × (timeout + backoff) ≤ ~150s, см. ниже).
- Логика блоков аудита, `calcScoresWeighted`, `directAudit` и пр.

## Бюджет времени (важно знать)

- **Худший случай для одного LLM-блока**: 3 попытки × 45s таймаут + 1s + 2s = **~138 секунд**. Это допустимо: вызовы LLM в `runPipeline` идут параллельно через `Promise.all` где возможно, а воркер с `concurrency=3` не блокируется. На практике 429 от OpenAI приходит за <1s, поэтому реальный overhead — 1s+2s = 3s в худшем случае при двух фейлах.
- Все ретраи логируются с лейблом и попыткой → видно в `logger.warn('PIPELINE_LLM', 'attempt 2/3 failed (status=429), retrying in 2000ms')`.

## Проверка

1. `cd owndev-backend && npx tsc --noEmit` — без ошибок.
2. Юнит-симуляция: подменить `fetch` mock'ом, возвращающим 429 первые 2 раза → 200 на 3-й. `llmCall` должен вернуть валидный ответ, в логах — две warn-строки.
3. Mock 429 ×3 → `llmCall` возвращает `''`, `llmToolCall` → `null`, `callJsonLlm` → `null`. Аудит не падает, блок просто пустой.
4. Mock 400 (неретраябельный) → одна попытка, мгновенный возврат пустого результата (без задержки).
5. Прод-канарейка: запустить site-check на любом сайте, убедиться что в логах НЕТ `attempt N/3 failed` (норма) и итоговый отчёт собирается как раньше.

