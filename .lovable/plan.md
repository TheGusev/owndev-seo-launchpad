

## Оптимизация производительности главной страницы

### Диагностика

| Метрика | Текущее | Цель |
|---------|---------|------|
| FCP | 6992ms | < 2500ms |
| DOM Content Loaded | 6574ms | < 3000ms |
| Event Listeners | 605 | < 200 |
| DOM Nodes | 2957 | < 1500 |

### Главные источники тормозов

1. **SparklesCore (tsparticles)** — тяжёлый canvas-движок с 80 частицами и fpsLimit=120. Основной убийца производительности
2. **3x ParallaxLayer в Hero** — каждый с отдельным scroll listener + framer-motion transforms
3. **GlowingEffect на 12 карточках инструментов** — каждая карточка слушает mousemove с proximity-детекцией = ~50+ event listeners только на этом
4. **MouseGradient + ClickRipple** — ещё 2 глобальных слушателя с частыми обновлениями DOM

### План исправлений

**1. Hero — убрать SparklesCore и ParallaxLayer**
- Заменить SparklesCore на лёгкий CSS-градиент (radial-gradient) — визуально похоже, 0 JS
- Убрать все 3 ParallaxLayer обёртки, оставить AnimatedGrid и FloatingParticles напрямую
- Уменьшить FloatingParticles с 20 до 10

**2. ToolsShowcase — убрать GlowingEffect с карточек**
- Заменить GlowingEffect (12 экземпляров с mousemove) на простой CSS hover-эффект (border-color transition)
- Сохранить GlowingEffect только на CTA-кнопке в Hero

**3. SparklesCore — удалить из Hero полностью**
- tsparticles загружает ~160KB JS + canvas rendering loop
- Заменить на CSS-анимацию звёздочек (несколько div с opacity animation)

**4. Lazy load тяжёлых секций**
- Обернуть FAQ, ContactForm, BlogPreview в `React.lazy` + `Suspense` — они ниже fold

### Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/components/Hero.tsx` | Убрать SparklesCore и ParallaxLayer, заменить на CSS-фон |
| `src/components/ToolsShowcase.tsx` | Убрать GlowingEffect с карточек, CSS hover вместо этого |
| `src/pages/Index.tsx` | Lazy load FAQ, ContactForm, BlogPreview |

### Ожидаемый результат
- Event listeners: 605 → ~100
- Убрана загрузка tsparticles (~160KB JS)
- FCP: ~7s → ~3s
- Плавный скролл без подтормаживаний

