

## 3 точечных UX/Accessibility фикса

### 1. Header: «Контакты» → route `/contacts`
**Файл:** `src/components/Header.tsx`, строка 15

Заменить `{ href: "#contact", label: "Контакты" }` на `{ href: "/contacts", label: "Контакты", isRoute: true }`.

### 2. Footer: динамический год
**Файл:** `src/components/Footer.tsx`, строка 113

Заменить `© 2025` на `© {new Date().getFullYear()}`.

### 3. ScanForm: aria-label на Input
**Файл:** `src/components/site-check/ScanForm.tsx`, строка 41-47

Добавить `aria-label="URL сайта для проверки"` на `<Input>`.

Три файла, три однострочных правки.

