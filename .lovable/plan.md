

## Заглушка оплаты — toast вместо редиректа

### Проблема
При нажатии «Перейти к оплате» вызывается `createReport` → edge function → redirect на report page. Это зависает, т.к. ЮKassa не подключена.

### Решение
В `SiteCheckResult.tsx` заменить `handlePay` — вместо вызова API просто показывать toast "Оплата скоро будет доступна" и не менять состояние `paying`.

**Файл: `src/pages/SiteCheckResult.tsx`** (строки 29-39)

Заменить:
```typescript
const handlePay = async (email: string) => {
  if (!scanId || paying) return;
  setPaying(true);
  try {
    const result = await createReport(scanId, email);
    toast({ title: "Отчёт готов!", description: "Перенаправляем на страницу отчёта..." });
    navigate(`/tools/site-check/report/${result.report_id}?token=${result.download_token}`);
  } catch (e: any) {
    toast({ title: "Ошибка", description: e.message || "Не удалось создать отчёт. Попробуйте позже.", variant: "destructive" });
    setPaying(false);
  }
};
```

На:
```typescript
const handlePay = async (email: string) => {
  toast({
    title: "Скоро будет доступно",
    description: "Подключение платежей находится в процессе настройки. Полный функционал будет доступен в ближайшее время.",
  });
};
```

1 файл, 1 правка.

