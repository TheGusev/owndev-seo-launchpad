

## Анимация появления пунктов «Что проверяем»

### Файл: `src/pages/SiteCheck.tsx`

Обернуть каждый `<li>` в IntersectionObserver-логику с `animate-fade-in` и нарастающей задержкой (`delay = i * 100ms`). Использовать уже существующую анимацию `fade-in` из Tailwind-конфига (translateY + opacity).

Реализация:
- Добавить `opacity-0` по умолчанию каждому элементу
- При появлении секции в viewport — добавить `animate-fade-in` + `animation-delay` через inline style `{ animationDelay: \`${i * 100}ms\`, animationFillMode: 'forwards' }`
- Использовать один `useRef` + `IntersectionObserver` на контейнер `<ul>`, чтобы запускать анимацию всех элементов одновременно (с задержками)
- Порог: `threshold: 0.2`

Никаких новых зависимостей или компонентов не требуется.

