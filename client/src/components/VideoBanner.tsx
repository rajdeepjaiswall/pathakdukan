import { useEffect, useRef, useState } from 'react';

interface VideoBannerProps {
  videoUrl: string;
  title: string;
  description?: string;
  onVideoEnd?: () => void;
  onVideoPlay?: () => void;
  autoPlay?: boolean;
  muted?: boolean;
  className?: string;
}

export default function VideoBanner({
  videoUrl,
  title,
  description,
  onVideoEnd,
  onVideoPlay,
  autoPlay = true,
  muted = true,
  className = ''
}: VideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setHasEnded(false);
      onVideoPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setHasEnded(true);
      onVideoEnd?.();
    };

    const handleLoadedData = () => {
      if (autoPlay) {
        video.play().catch(console.error);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [autoPlay, onVideoEnd, onVideoPlay]);

  return (
    <div className={`relative h-[200px] md:h-[250px] overflow-hidden rounded-lg ${className}`}>
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        muted={muted}
        playsInline
        preload="metadata"
        poster="" // Add a poster image if needed
      >
        Your browser does not support the video tag.
      </video>

      {/* Overlay with title and description */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <h3 className="text-white text-xl md:text-2xl font-bold mb-2 drop-shadow-lg">
            {title}
          </h3>
          {description && (
            <p className="text-white/90 text-sm md:text-base drop-shadow-lg line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Play indicator */}
      {!isPlaying && !hasEnded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
          </div>
        </div>
      )}
    </div>
  );
}