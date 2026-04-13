

## LLM Provider Abstraction: OpenAI → Lovable AI Gateway

### Summary

All LLM calls in the backend are in `SiteCheckPipeline.ts` via two low-level functions (`llmCall`, `llmToolCall`). The simplest and safest approach: make these two functions switchable by env var, without touching any business logic above them.

### Architecture

The Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) is **OpenAI-compatible** — same request/response format. So switching providers means changing only: URL, auth header, and model name.

```text
┌─────────────────────────────────┐
│  SiteCheckPipeline.ts           │
│  detectTheme / extractKeywords  │
│  generateMinusWords / etc.      │
│         │                       │
│    llmCall() / llmToolCall()    │  ← These two functions are the ONLY change point
│         │                       │
│  ┌──────┴──────┐                │
│  │ LLM_PROVIDER │               │
│  │ = lovable?   │               │
│  └──┬──────┬───┘                │
│     │      │                    │
│  Lovable  OpenAI                │
│  Gateway  API                   │
└─────────────────────────────────┘
```

### Changes — 3 files

#### 1. `owndev-backend/src/services/SiteCheckPipeline.ts`

Replace `llmCall` and `llmToolCall` (lines 292-342) to read env vars and route accordingly:

```typescript
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'openai';

function getLlmConfig(apiKey: string) {
  if (LLM_PROVIDER === 'lovable') {
    const lovableKey = process.env.LOVABLE_API_KEY || apiKey;
    return {
      url: 'https://ai.gateway.lovable.dev/v1/chat/completions',
      authHeader: `Bearer ${lovableKey}`,
      defaultModel: 'google/gemini-2.5-flash',
    };
  }
  return {
    url: 'https://api.openai.com/v1/chat/completions',
    authHeader: `Bearer ${apiKey}`,
    defaultModel: 'gpt-4o-mini',
  };
}
```

Then `llmCall` and `llmToolCall` use `getLlmConfig(apiKey)` instead of hardcoded URL/model. All callers (`detectTheme`, `extractKeywords`, `generateMinusWords`, `generateDirectAd`, `competitorAnalysis`) pass `'gpt-4o-mini'` as model — this gets overridden by `config.defaultModel` when provider is lovable.

**No other code changes in this file.** All prompts, parsing, return types stay identical.

#### 2. `owndev-backend/src/workers/SiteCheckWorker.ts`

Line 13: also read `LOVABLE_API_KEY` as fallback:
```typescript
const API_KEY = process.env.OPENAI_API_KEY || process.env.LOVABLE_API_KEY || '';
```

Pass this to `runPipeline` as before. The `llmCall`/`llmToolCall` inside will pick the right URL based on `LLM_PROVIDER`.

#### 3. `owndev-backend/.env.example`

Add:
```
LLM_PROVIDER=lovable
LOVABLE_API_KEY=your_lovable_api_key_here
```

### Model choice for Lovable

Using `google/gemini-2.5-flash` as default — good balance of speed and quality for structured JSON extraction (keywords, minus-words, competitors, ad copy). Tool calling is supported.

### What does NOT change

- All pipeline business logic (steps 0-8)
- All return types (`PipelineResult`, `Issue`, `KeywordEntry`, `MinusWord`, etc.)
- All prompts (system + user)
- Worker DB writes (scores, issues, competitors, keywords, minus_words, seo_data)
- API endpoints and response format
- Frontend components
- Edge functions (they have their own LLM integration)

### Verification after implementation

- Build check: `cd owndev-backend && npx tsc --noEmit`
- Log output to confirm Lovable Gateway is being called
- Data format stays identical — frontend displays without changes

### Risk mitigation

- If Lovable Gateway returns different JSON structure in tool_calls — the existing `safeParseJson` handles edge cases
- If LOVABLE_API_KEY is missing — falls back to empty string, same as current OpenAI behavior (returns empty results gracefully)
- Switching back: just set `LLM_PROVIDER=openai` in env

