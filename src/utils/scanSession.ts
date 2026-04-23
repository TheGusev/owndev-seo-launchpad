/**
 * clearScanSession — гарантирует, что новый запуск аудита стартует "с нуля".
 * Вызывать в момент ручного сабмита формы или перед автозапуском по ?url=.
 * НЕ вызывать на странице результата — там scan_id из URL pathname нужен.
 */
export function clearScanSession(): void {
  try {
    // 1. localStorage: всё, что заканчивается на scan_id / scanId
    Object.keys(localStorage)
      .filter((k) => /scan_?id$/i.test(k))
      .forEach((k) => localStorage.removeItem(k));

    // Дополнительно — известные ключи "последнего скана"
    localStorage.removeItem("owndev_last_scan_url");
    localStorage.removeItem("owndev_last_scan_id");
  } catch {
    /* localStorage может быть недоступен (privacy mode) — игнорируем */
  }

  // 2. URL: вычистить ?scan_id= без перезагрузки
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has("scan_id")) {
      url.searchParams.delete("scan_id");
      window.history.replaceState({}, "", url.toString());
    }
  } catch {
    /* SSR / отсутствует window — игнорируем */
  }
}