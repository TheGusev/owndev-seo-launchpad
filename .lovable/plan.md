

## Замена emoji-иконок на Lucide-иконки

### Проблема
На сайте в нескольких местах используются emoji (📊, 🤖, 🚀, 📄, 📝, 🏆) вместо современных Lucide-иконок. Это выглядит непрофессионально и не вписывается в тёмную tech-эстетику сайта.

### Замены по файлам

#### 1. `src/pages/GeoAudit.tsx` — секция "SEO → AI → GEO"
| Было | Станет |
|------|--------|
| `📊` SEO (было) | `<BarChart3>` из lucide-react |
| `🤖` AI-поиск | `<BrainCircuit>` из lucide-react |
| `🚀` GEO (ответ) | `<Rocket>` из lucide-react |

Заменить `icon: "📊"` (string) на `icon: BarChart3` (компонент). Обновить рендер: вместо `<div>{e.icon}</div>` → `<e.icon className="w-7 h-7 text-primary" />`.

#### 2. `src/components/landing/ReportValue.tsx` — заголовки отчётов
| Было | Станет |
|------|--------|
| `📄 PDF-отчёт` | `<FileDown className="w-5 h-5 text-primary inline" /> PDF-отчёт` |
| `📝 Word-отчёт` | `<FileText className="w-5 h-5 text-primary inline" /> Word-отчёт` |

#### 3. `src/components/ToolsShowcase.tsx` — badge "🏆 GEO-аудит"
Заменить `🏆` на `<Trophy className="w-3 h-3" />` (уже в flex с gap, просто заменить символ).

#### 4. `src/pages/Tools.tsx` — badge "🏆 GEO-аудит"
Аналогично: `🏆` → `<Trophy className="w-3 h-3" />`.

#### 5. `src/pages/SiteCheckResult.tsx` — ссылка "🤖 Скачать llms.txt"
Заменить `🤖` → `<Bot className="w-4 h-4" />`.

### Файлы (5)

| Файл | Изменение |
|------|-----------|
| `src/pages/GeoAudit.tsx` | Emoji → Lucide icons (BarChart3, BrainCircuit, Rocket) |
| `src/components/landing/ReportValue.tsx` | Emoji → Lucide icons (FileDown, FileText) |
| `src/components/ToolsShowcase.tsx` | 🏆 → Trophy icon |
| `src/pages/Tools.tsx` | 🏆 → Trophy icon |
| `src/pages/SiteCheckResult.tsx` | 🤖 → Bot icon |

