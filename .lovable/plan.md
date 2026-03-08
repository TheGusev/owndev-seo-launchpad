

## Plan: Add CSV Export to Semantic Core Generator

Add a "Download CSV" button next to the existing "Copy all" button in `SemanticCoreGenerator.tsx`.

### Changes

**MODIFY** `src/components/tools/SemanticCoreGenerator.tsx`:
- Add a `handleDownloadCSV` function that converts clusters to CSV format (columns: Кластер, Интент, Ключевое слово)
- Add a Download button (using existing `Download` icon from lucide) next to the copy button
- Each keyword gets its own row with cluster name and intent repeated

CSV format:
```
Кластер,Интент,Ключевое слово
"Ремонт под ключ","commercial","ремонт квартир под ключ"
"Ремонт под ключ","commercial","ремонт квартир цена"
```

Single file change, ~15 lines added.

