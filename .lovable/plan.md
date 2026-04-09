

## Обновление страницы /geo-audit: убрать Direct Score, сфокусировать на AI

### Изменение

В файле `src/pages/GeoAudit.tsx` заменить 6-ю карточку «Direct Score» (строка 67) на карточку про AI-ботов:

**Было:**
```typescript
{ icon: Brain, title: "Direct Score", desc: "Готовность к рекламе в Яндекс.Директ: ключи, минус-слова, конкуренты.", weight: "Отдельная метрика" },
```

**Станет:**
```typescript
{ icon: Brain, title: "AI-боты и краулеры", desc: "Проверка доступности для GPTBot, ClaudeBot, YandexBot-AI. Правильные настройки robots.txt для AI-краулеров.", weight: "+15 LLM Score" },
```

Это единственное изменение — остальные 5 карточек уже полностью про AI-видимость.

