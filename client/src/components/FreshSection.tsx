import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProductUrl } from '@/lib/product-url';
import { useState, useEffect, useRef, useCallback } from 'react';
import { formatPrice } from '@/lib/cart';

const TITLES = [
  'Straight From The Oven',
  'Fresh From The Kitchen',
  'Just Baked Today',
  'Hot From The Bakery',
  'Freshly Made For You',
  'Right Out Of Oven',
  "Chef's Fresh Picks",
  "Today's Fresh Batch",
];

function useRotatingTitle(titles: string[], intervalMs = 4000) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex(i => (i + 1) % titles.length);
        setFading(false);
      }, 400);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [titles.length, intervalMs]);

  return { title: titles[index], fading };
}

export default function FreshSection() {
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/products/new-arrivals'],
  });

  const { title, fading } = useRotatingTitle(TITLES);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const scrollBy = useCallback((dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const isDesktop = window.innerWidth >= 1024;
    const cardWidth = (isDesktop ? 192 : 160) + 16;
    scrollRef.current.scrollBy({ left: dir === 'right' ? cardWidth * 2 : -cardWidth * 2, behavior: 'smooth' });
  }, []);

  // Auto-scroll in REVERSE (right → left) every 4 seconds
  useEffect(() => {
    if (isHovered || !scrollRef.current || products.length === 0) return;

    autoScrollRef.current = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollLeft <= 4) {
        // Reached beginning — jump to end
        el.scrollTo({ left: el.scrollWidth - el.clientWidth, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: -200, behavior: 'smooth' });
      }
    }, 4000);

    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [isHovered, products.length]);

  if (isLoading) return null;
  if (!products || products.length === 0) return null;

  return (
    <section className="py-4 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div
          className="rounded-[2.5rem] shadow-lg px-6 lg:px-10 py-8 lg:py-10"
          style={{ background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 min-w-0 pr-4">
              <div className="relative">
                <div className="absolute -inset-2 bg-amber-200/40 blur-xl rounded-full" />
                <h2
                  className="relative text-2xl lg:text-3xl font-black text-amber-900 leading-tight"
                  style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(4px)' : 'translateY(0)', transition: 'opacity 0.4s ease, transform 0.4s ease' }}
                >
                  {title}
                </h2>
              </div>
            </div>

            {/* Arrow Controls */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => scrollBy('left')}
                className="w-9 h-9 lg:w-11 lg:h-11 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-amber-50 active:scale-90 transition-all duration-150"
              >
                <ChevronLeft className="h-5 w-5 text-amber-900" />
              </button>
              <button
                onClick={() => scrollBy('right')}
                className="w-9 h-9 lg:w-11 lg:h-11 rounded-full bg-amber-900 shadow-md flex items-center justify-center hover:bg-amber-800 active:scale-90 transition-all duration-150"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Horizontal Carousel — gap-5 lg:gap-6 for visible spacing */}
          <div
            ref={scrollRef}
            className="flex gap-5 lg:gap-6 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product, index) => (
              <Link key={product.id} href={getProductUrl(product)} className="flex-shrink-0">
                <div
                  className="w-36 sm:w-40 lg:w-48 bg-white rounded-3xl shadow-md hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 overflow-hidden cursor-pointer border border-amber-100"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {/* Image */}
                  <div className="relative h-36 sm:h-40 lg:h-48 overflow-hidden rounded-t-3xl">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=75'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* NEW badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md inline-block"
                        style={{ animation: 'badge-bounce 2s ease-in-out infinite' }}
                      >
                        NEW
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 lg:p-4">
                    <p className="font-bold text-amber-900 text-xs lg:text-sm leading-tight mb-1 line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-amber-700 font-extrabold text-sm lg:text-base">
                      {formatPrice(parseFloat(product.price))}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes badge-bounce {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-3px); }
          60% { transform: translateY(-1px); }
        }
      `}</style>
    </section>
  );
}
