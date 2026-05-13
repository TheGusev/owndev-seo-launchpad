// iPhone-friendly сохранение Blob.
// - iOS + Web Share API с файлами: системный share-sheet
// - Прочие: классический <a download>
// - iOS без Share API: открыть в новой вкладке (preview в Safari)

export async function saveFileForUser(blob: Blob, filename: string): Promise<'share' | 'download' | 'open'> {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS && typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    try {
      const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
        return 'share';
      }
    } catch {
      // отмена/ошибка — фоллбек
    }
  }

  const url = URL.createObjectURL(blob);

  if (isIOS) {
    // iOS Safari игнорирует <a download> — открываем в новой вкладке.
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'open';
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return 'download';
}
