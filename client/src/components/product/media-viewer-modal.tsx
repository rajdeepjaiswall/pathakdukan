import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';

export type MediaItem = { type: 'image' | 'video'; url: string };

interface Props {
  items: MediaItem[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  alt?: string;
}

const SWIPE_THRESHOLD = 50;

export default function MediaViewerModal({ items, index, onIndexChange, onClose, alt }: Props) {
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const current = items[index];
  const hasMany = items.length > 1;

  const goPrev = () => {
    if (!hasMany) return;
    onIndexChange((index - 1 + items.length) % items.length);
  };
  const goNext = () => {
    if (!hasMany) return;
    onIndexChange((index + 1) % items.length);
  };

  // Close on Escape, navigate with arrow keys, lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, items.length, onClose]);

  // Pause video when switching media or unmounting
  useEffect(() => {
    return () => {
      const v = videoRef.current;
      if (v) {
        try { v.pause(); } catch {}
      }
    };
  }, [index]);

  // Reset mute state per video so each video starts muted (autoplay friendly)
  useEffect(() => {
    if (current?.type === 'video') {
      setMuted(true);
    }
  }, [current?.url, current?.type]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0) goPrev();
      else goNext();
    }
  };

  if (!current) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}
      data-testid="modal-media-viewer"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        aria-label="Close"
        data-testid="button-close-viewer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Mute/Unmute (videos only) */}
      {current.type === 'video' && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMuted((m) => {
              const next = !m;
              if (videoRef.current) videoRef.current.muted = next;
              return next;
            });
          }}
          className="absolute top-4 left-4 z-20 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
          aria-label={muted ? 'Unmute' : 'Mute'}
          data-testid="button-toggle-mute"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}

      {/* Prev / Next */}
      {hasMany && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white items-center justify-center transition-colors"
            aria-label="Previous"
            data-testid="button-viewer-prev"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white items-center justify-center transition-colors"
            aria-label="Next"
            data-testid="button-viewer-next"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </>
      )}

      {/* Media */}
      <div
        className="relative w-full h-full flex items-center justify-center px-4 py-16 sm:px-20"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {current.type === 'video' ? (
          <video
            key={current.url}
            ref={videoRef}
            src={current.url}
            autoPlay
            muted={muted}
            playsInline
            controls
            className="max-w-full max-h-full object-contain rounded-lg"
            data-testid="viewer-video"
          />
        ) : (
          <img
            key={current.url}
            src={current.url}
            alt={alt || ''}
            className="max-w-full max-h-full object-contain rounded-lg select-none"
            draggable={false}
            data-testid="viewer-image"
          />
        )}
      </div>

      {/* Indicator dots */}
      {hasMany && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to media ${i + 1}`}
              data-testid={`button-viewer-dot-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}
