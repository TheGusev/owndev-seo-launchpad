

## Уже сделано — изменений не требуется

Проверил `owndev-backend/src/services/SiteCheckPipeline.ts`. Логика проверки битых ссылок **уже реализована именно так, как ты описываешь** — параллельно через `Promise.all` с таймаутом 5 секунд через `AbortController`.

## Что есть в коде

**Строки 11–23** — утилита `fetchWithTimeout` с `AbortController`:
```ts
async function fetchWithTimeout(url: string, timeoutMs = 8000, opts: RequestInit = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...opts, signal: controller.signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
    clearTimeout(id);
    return resp;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}
```

**Строки 33–38** — `checkUrl` использует HEAD с `redirect: 'follow'` и таймаутом 5 секунд:
```ts
async function checkUrl(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const resp = await fetchWithTimeout(url, 5000, { method: 'HEAD', redirect: 'follow' });
    return { ok: resp.ok, status: resp.status };
  } catch { return { ok: false, status: 0 }; }
}
```

**Строки 1333–1335** — параллельный запуск через `Promise.all`:
```ts
const uniqueHrefs = [...new Set(internalHrefs)].slice(0, 15);
const linkResults = await Promise.all(uniqueHrefs.map(h => checkUrl(h)));
const brokenLinks = uniqueHrefs.filter((_, i) => !linkResults[i].ok && linkResults[i].status !== 0);
```

## Сравнение с твоим предложенным решением

| Аспект | Твой код | Текущий код |
|---|---|---|
| HTTP метод | `HEAD` | `HEAD` ✅ |
| `redirect: 'follow'` | да | да ✅ |
| Таймаут 5 сек через `AbortController` | да | да ✅ |
| `Promise.all` параллельно | да | да ✅ |
| Лимит на кол-во ссылок | нет | `.slice(0, 15)` (доп. защита) |
| Ошибка/таймаут = битая | `false` | `{ ok: false, status: 0 }` + фильтр исключает `status === 0` (см. ниже) |

## Один нюанс на твоё решение

Текущий фильтр специально **исключает** ссылки с `status === 0` (таймаут/сетевая ошибка) из списка `brokenLinks`, чтобы не показывать в отчёте «битыми» ссылки на сайты, которые просто медленно отвечают. То есть сейчас в `brokenLinks` попадают только ссылки с реальными HTTP-ошибками (4xx/5xx). Если хочешь, чтобы таймауты тоже считались битыми (как в твоём примере) — это **отдельное продуктовое решение**, не баг производительности. Скажи, если нужно поменять — сделаю отдельной задачей.

## Что делать сейчас

Ничего. Производительность уже параллельная, сайт-блокировщик не положит аудит дольше 5 секунд на этот шаг. `tsc --noEmit` уже зелёный для этого блока.

