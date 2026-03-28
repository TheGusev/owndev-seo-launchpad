

## БЛОК 1 — Критические фиксы (3 задачи)

### Текущее состояние

**FIX 1 (Оплата):** `handlePay` в `SiteCheckResult.tsx` уже показывает toast "Скоро будет доступно" — но это скучный toast. Промт требует Dialog с полем email и отправкой в Telegram.

**FIX 2 (Лимит):** Backend (`site-check-scan`) уже возвращает `last_scan_id` при 429/DOMAIN_LIMIT. Фронтенд (`SiteCheck.tsx`) уже показывает информационный блок с кнопкой "Смотреть результаты". Но также показывает toast "Лимит проверок" — нужно убрать toast.

**FIX 3 (URL между инструментами):** `localStorage('owndev_last_url')` сохраняется только в SEOAuditor и InternalLinksChecker. ScanForm уже читает из localStorage и URL-параметра. Не сохраняют: CompetitorAnalysis, IndexationChecker, PositionMonitor, LLMPromptHelper. SiteCheckBanner использует `<a>` вместо `<Link>`.

---

### FIX 1 — Модальное окно вместо toast при оплате

**`src/pages/SiteCheckResult.tsx`:**
- Добавить state `showPaymentModal` и `paymentEmail`
- `handlePay` → открыть Dialog вместо toast
- Dialog содержит: заголовок "Платежи скоро появятся", текст про скидку 30%, поле email, кнопка "Уведомить меня"
- По нажатию "Уведомить меня" → вызов edge function `send-telegram` с данными email (нужно слегка адаптировать вызов — send-telegram ожидает name/phone/email/service, передаём email как email, name как "Ожидание оплаты", service как "Site Check", phone как "—")
- После отправки — toast "Вы в списке!" и закрытие модала

### FIX 2 — Убрать toast при лимите

**`src/pages/SiteCheck.tsx` (строка 41):**
- Удалить `toast({ title: "Лимит проверок" ... })` — информационный блок уже отображается ниже формы, toast дублирует и создаёт ощущение ошибки

### FIX 3 — Сохранение URL во всех инструментах

**Новый файл `src/utils/lastUrl.ts`:**
```typescript
export const saveLastUrl = (url: string) => localStorage.setItem('owndev_last_url', url);
export const getLastUrl = (): string => localStorage.getItem('owndev_last_url') || '';
```

**Инструменты, куда добавить `saveLastUrl(url)` при submit:**
- `CompetitorAnalysis.tsx` — `saveLastUrl(url1)` после успешного анализа
- `IndexationChecker.tsx` — `saveLastUrl(url)` после проверки  
- `PositionMonitor.tsx` — `saveLastUrl(url)` при добавлении
- `LLMPromptHelper.tsx` — `saveLastUrl(url)` при генерации (если url непустой)
- `SEOAuditor.tsx` — уже есть, заменить на `saveLastUrl`
- `InternalLinksChecker.tsx` — уже есть, заменить на `saveLastUrl`

**`src/components/SiteCheckBanner.tsx`:**
- Заменить `<a href>` на `<Link to>` из react-router-dom

**`src/components/site-check/ScanForm.tsx`:**
- Импортировать `saveLastUrl` из utils
- В `handleSubmit` добавить `saveLastUrl(cleanUrl)` 
- useEffect уже читает из localStorage — OK

---

### Файлы

| Файл | Действие |
|------|----------|
| `src/utils/lastUrl.ts` | Новый — утилита saveLastUrl/getLastUrl |
| `src/pages/SiteCheckResult.tsx` | Dialog вместо toast при оплате, отправка email в Telegram |
| `src/pages/SiteCheck.tsx` | Убрать toast при лимите |
| `src/components/SiteCheckBanner.tsx` | `<a>` → `<Link>` |
| `src/components/site-check/ScanForm.tsx` | saveLastUrl при submit |
| `src/components/tools/SEOAuditor.tsx` | Импорт saveLastUrl |
| `src/components/tools/InternalLinksChecker.tsx` | Импорт saveLastUrl |
| `src/components/tools/CompetitorAnalysis.tsx` | Добавить saveLastUrl |
| `src/components/tools/IndexationChecker.tsx` | Добавить saveLastUrl |
| `src/components/tools/PositionMonitor.tsx` | Добавить saveLastUrl |
| `src/components/tools/LLMPromptHelper.tsx` | Добавить saveLastUrl |

