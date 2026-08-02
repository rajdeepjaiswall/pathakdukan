import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  placement?: string | null;
  displayOrder?: number;
}

const PLACEMENT = 'after_trending_mini';

export function MiniBannerSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ['/api/banners'],
  });

  const slides = (banners as Banner[])
    .filter((b) => b.isActive && (b.placement || '') === PLACEMENT && !!b.imageUrl)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  // Reset to slide 0 if the count changes (e.g., admin removed a banner)
  useEffect(() => {
    if (currentSlide >= slides.length) setCurrentSlide(0);
  }, [slides.length, currentSlide]);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative w-full h-32 md:h-36 bg-background overflow-hidden rounded-lg mx-4 sm:mx-6 lg:mx-8" data-testid="mini-banner-slideshow">
      <div
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((banner) => (
          <div key={banner.id} className="w-full h-full flex-shrink-0 relative">
            <img
              src={banner.imageUrl as string}
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <h3 className="text-lg md:text-xl font-bold mb-1">{banner.title}</h3>
                {banner.description && (
                  <p className="text-xs md:text-sm opacity-90">{banner.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-navy p-2 rounded-full transition-all duration-200"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-navy p-2 rounded-full transition-all duration-200"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
