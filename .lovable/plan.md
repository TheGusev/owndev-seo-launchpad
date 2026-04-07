

## Хук useAudit() + session state layer

### Подход

React Context + useReducer (без новых зависимостей). Лёгкий in-memory store с сессиями аудитов. Хук `useAudit()` инкапсулирует loading/error/result + автоматически сохраняет сессии.

### Файлы

| Файл | Действие |
|------|----------|
| `src/state/audit/types.ts` | Новый — AuditSession, AuditState, Action types |
| `src/state/audit/store.tsx` | Новый — AuditContext, AuditProvider, reducer, useAuditState(), useAuditActions() |
| `src/state/audit/useAudit.ts` | Новый — хук useAudit(toolId) с loading/error/result + run() |
| `src/state/audit/index.ts` | Новый — barrel exports |
| `src/App.tsx` | Обернуть в `<AuditProvider>` |
| 8 компонентов tools | Заменить локальный useState на useAudit() |

### 1. Типы (`types.ts`)

```typescript
import { ToolId, AuditResult } from '@/lib/api/types';

export interface AuditSession {
  id: string;
  url: string;
  toolId: ToolId;
  createdAt: string;
  loading: boolean;
  error: string | null;
  result: any | null; // any, т.к. каждый инструмент возвращает свой формат
}

export interface AuditState {
  currentSessionId: string | null;
  sessions: Record<string, AuditSession>;
}

// Action union type for reducer
```

### 2. Store (`store.tsx`)

- `AuditProvider` с `useReducer`
- Actions: `ADD_SESSION`, `SET_LOADING`, `SET_RESULT`, `SET_ERROR`, `SET_CURRENT`
- `useAuditState()` — доступ к state
- `useAuditActions()` — dispatch-обёртки: `addSession()`, `updateResult()`, `setError()`, `setCurrent()`
- Геттер `getSessionsByTool(toolId)` для истории по инструменту

### 3. Хук `useAudit(toolId)`

```typescript
function useAudit<T>(toolId: ToolId) {
  const { addSession, updateResult, setError, setCurrent } = useAuditActions();
  const state = useAuditState();
  
  const run = async (url: string, apiFn: () => Promise<T>) => {
    const sessionId = crypto.randomUUID();
    addSession({ id: sessionId, url, toolId, createdAt: new Date().toISOString(), loading: true, error: null, result: null });
    setCurrent(sessionId);
    try {
      const result = await apiFn();
      updateResult(sessionId, result);
      return result;
    } catch (e) {
      setError(sessionId, e.message);
      throw e;
    }
  };

  // Current session derived from state
  const current = state.currentSessionId ? state.sessions[state.currentSessionId] : null;
  const history = Object.values(state.sessions).filter(s => s.toolId === toolId);

  return { run, current, history, sessions: state.sessions };
}
```

### 4. Интеграция в компоненты

Пример для SEOAuditor — вместо 3 отдельных useState (loading, error, result):

```typescript
const { run, current } = useAudit<AuditResult>('seo-audit');

const runAudit = async () => {
  await run(url, () => auditSite(url));
};

// current?.loading, current?.error, current?.result
```

Аналогично для BrandTracker, IndexationChecker, InternalLinksChecker, CompetitorAnalysis, ContentBriefGenerator, SemanticCoreGenerator, AITextGenerator.

### 5. App.tsx

Добавить `<AuditProvider>` внутрь QueryClientProvider, снаружи BrowserRouter.

### Ограничения
- Header, меню, "Последние проверки" — 0 изменений
- UI рендеринг не меняется — только источник данных (из хука вместо локального state)
- Каждый компонент сохраняет свои уникальные типы результата (BrandResult, CompetitorResult и т.д.) — хук generic

