import { Card } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface Props {
  images?: string[];
  videoUrl?: string | null;
}

export default function GeneratedCreatives({ images, videoUrl }: Props) {
  const hasImages = Array.isArray(images) && images.length > 0;
  const hasVideo = typeof videoUrl === 'string' && videoUrl.length > 0;
  if (!hasImages && !hasVideo) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Сгенерированные креативы</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Демо-вариант улучшенной фото-карточки и короткого ролика, сгенерированных AI на основе
        ваших данных. Можно использовать как референс для дизайнера.
      </p>

      {hasImages && (
        <Card className="p-4 mb-4">
          <div className="text-sm font-medium mb-3">Фото-карточки</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images!.map((src, i) => (
              <a
                key={i}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border bg-muted hover:opacity-90 transition"
              >
                <img
                  src={src}
                  alt={`Сгенерированная карточка ${i + 1}`}
                  loading="lazy"
                  className="w-full aspect-square object-cover"
                />
              </a>
            ))}
          </div>
        </Card>
      )}

      {hasVideo && (
        <Card className="p-4">
          <div className="text-sm font-medium mb-3">Видео-ролик</div>
          <video
            src={videoUrl!}
            controls
            playsInline
            preload="metadata"
            className="w-full max-w-xl rounded-lg bg-black"
          >
            Ваш браузер не поддерживает видео.
          </video>
        </Card>
      )}
    </div>
  );
}
