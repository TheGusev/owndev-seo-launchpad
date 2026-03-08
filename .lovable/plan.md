

## Plan: Activate SemanticCoreGenerator, AITextGenerator, AntiDuplicateChecker

### 1. SemanticCoreGenerator — AI-powered via edge function

**Edge function:** `supabase/functions/generate-semantic-core/index.ts`
- Accepts `{ query: string, region: string }`
- Calls Lovable AI (gemini-3-flash-preview) with a prompt to generate 15-25 keywords clustered into 3 groups: Информационные, Коммерческие, Транзакционные
- Returns structured JSON via tool calling: `{ clusters: [{ name, keywords: [{ keyword, intent, estimatedVolume }] }] }`

**Frontend:** Rewrite `SemanticCoreGenerator.tsx`
- State for query, region, loading, results
- Call edge function on button click
- Display clusters in 3 cards with keyword lists
- Add "Скачать CSV" button for export
- Remove "Скоро" badge, enable button

### 2. AITextGenerator — AI-powered via edge function

**Edge function:** `supabase/functions/generate-text/index.ts`
- Accepts `{ type: string, city: string, niche: string }`
- Calls Lovable AI with type-specific system prompts (intro, FAQ, service description, meta description)
- Streams response back as SSE for real-time text rendering

**Frontend:** Rewrite `AITextGenerator.tsx`
- State for type, city, niche, loading, generated text
- Stream tokens into the textarea result area
- Add "Скопировать" button
- Remove "Скоро" badge, enable button

### 3. AntiDuplicateChecker — frontend-only text analysis

No backend needed. Pure client-side analysis:
- **N-gram repetition**: Count repeated 3-4 word phrases, flag high repetition
- **Template detection**: Check for unresolved `{placeholders}` 
- **Sentence diversity**: Compare unique sentence starts vs total sentences
- **Word diversity**: Unique words / total words ratio
- **Score 0-100**: Weighted formula from all metrics
- **Issues list**: Specific findings with severity

**Frontend:** Rewrite `AntiDuplicateChecker.tsx`
- State for text input, loading, results (score, issues)
- Analyze on button click (synchronous, no API)
- Show score in progress bar with color gradient
- Show issues list with recommendations
- Remove "Скоро" badge, enable button

### 4. Update tools-registry.ts

Change status from `coming_soon` to `active` for all three tools.

### Files

| Action | File |
|--------|------|
| CREATE | `supabase/functions/generate-semantic-core/index.ts` |
| CREATE | `supabase/functions/generate-text/index.ts` |
| REWRITE | `src/components/tools/SemanticCoreGenerator.tsx` |
| REWRITE | `src/components/tools/AITextGenerator.tsx` |
| REWRITE | `src/components/tools/AntiDuplicateChecker.tsx` |
| MODIFY | `src/data/tools-registry.ts` (3 status changes) |

