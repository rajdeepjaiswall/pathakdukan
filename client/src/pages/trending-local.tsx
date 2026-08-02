import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { getProductUrl } from '@/lib/product-url';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/cart';
import Header from '@/components/layout/header';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';

const BADGE_OPTIONS = ['BEST SELLER', 'MUST TRY', 'TRENDING', 'FAN FAV', 'LIMITED', 'HOT NOW'];

function getBadge(index: number) {
  return BADGE_OPTIONS[index % BADGE_OPTIONS.length];
}

function MasonryCard({ product, index, onClick }: { product: any; index: number; onClick: () => void }) {
  const { addToCart } = useCart();
  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80';
  const price = parseFloat(product.price);

  const heights = ['h-44', 'h-56', 'h-48', 'h-64', 'h-52', 'h-40', 'h-60', 'h-36'];
  const imgH = heights[index % heights.length];

  return (
    <div
      className="mb-4 break-inside-avoid bg-[#F5EFE6] rounded-3xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className={`relative ${imgH} overflow-hidden rounded-t-3xl`}>
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F5EFE6]/90 text-[#3E2723] px-2.5 py-1 rounded-full shadow-sm">
            {getBadge(index)}
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="font-bold text-[#3E2723] text-sm leading-tight mb-1 line-clamp-2">{product.name}</p>
        {product.weight && (
          <p className="text-[#795548] text-xs mb-2">{product.weight}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#3E2723] font-extrabold text-sm">{formatPrice(price)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); addToCart(product.id, 1); }}
            className="w-8 h-8 rounded-full bg-[#3E2723] hover:bg-[#5D4037] active:scale-95 flex items-center justify-center shadow transition-all"
          >
            <ShoppingCart className="h-3.5 w-3.5 text-[#F5EFE6]" />
          </button>
        </div>
      </div>
    </div>
  );
}

type Slide = { url: string; type: 'image' | 'video' };

function ProductMediaCarousel({ slides, productName }: { slides: Slide[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState<Set<number>>(new Set());
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const touchStartX = useRef<number | null>(null);

  // Pick visible slides (skip ones that errored)
  const visibleIdx = useMemo(
    () => slides.map((_, i) => i).filter((i) => !failed.has(i)),
    [slides, failed],
  );
  const safeActive = visibleIdx.includes(active) ? active : visibleIdx[0] ?? 0;
  const visibleCount = visibleIdx.length;

  const goTo = (next: number) => {
    if (visibleCount === 0) return;
    const pos = visibleIdx.indexOf(safeActive);
    const nextPos = ((pos + next) % visibleCount + visibleCount) % visibleCount;
    setActive(visibleIdx[nextPos]);
  };

  const markFailed = (idx: number) => {
    setFailed((prev) => {
      const n = new Set(prev);
      n.add(idx);
      return n;
    });
    if (idx === safeActive) {
      const remaining = visibleIdx.filter((i) => i !== idx);
      if (remaining.length > 0) setActive(remaining[0]);
    }
  };

  const markLoaded = (idx: number) => {
    setLoaded((prev) => {
      if (prev.has(idx)) return prev;
      const n = new Set(prev);
      n.add(idx);
      return n;
    });
  };

  // Pause non-active videos; play the active one
  useEffect(() => {
    slides.forEach((s, i) => {
      const v = videoRefs.current[i];
      if (!v || s.type !== 'video') return;
      if (i === safeActive) {
        try {
          v.currentTime = 0;
          const p = v.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch {}
      } else {
        try {
          v.pause();
        } catch {}
      }
    });
  }, [safeActive, slides]);

  // Touch swipe (mobile)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40 || visibleCount <= 1) return;
    goTo(dx < 0 ? 1 : -1);
  };

  if (visibleCount === 0) return null;

  const activeLoaded = loaded.has(safeActive);

  return (
    <div
      className="relative w-full bg-[#EDE3D3] select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Loading spinner — visible until the active slide reports it has loaded */}
      {!activeLoaded && (
        <div className="w-full flex items-center justify-center" style={{ minHeight: '18rem' }} data-testid="popup-loader">
          <Loader2 className="animate-spin h-10 w-10 text-[#3E2723]/50" />
        </div>
      )}

      {slides.map((s, i) => {
        if (failed.has(i)) return null;
        const isActive = i === safeActive;
        const isLoaded = loaded.has(i);
        // Active + not yet loaded → keep the element in DOM but invisible (so onLoad fires) above the spinner
        // Active + loaded → show normally
        // Inactive → keep mounted (so they preload and videos stay paused) but hidden via display:none
        const showBlock = isActive && isLoaded;
        const wrapperStyle: React.CSSProperties = isActive
          ? (isLoaded ? {} : { position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' })
          : { display: 'none' };

        return (
          <div
            key={`${s.url}-${i}`}
            className={`w-full ${showBlock ? 'block' : ''}`}
            style={wrapperStyle}
          >
            {s.type === 'video' ? (
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                src={s.url}
                className="block w-full h-auto"
                muted
                playsInline
                autoPlay={isActive}
                controls={false}
                preload="metadata"
                onLoadedData={() => markLoaded(i)}
                onError={() => markFailed(i)}
                data-testid={`popup-video-${i}`}
              />
            ) : (
              <img
                src={s.url}
                alt={productName}
                className="block w-full h-auto"
                onLoad={() => markLoaded(i)}
                onError={() => markFailed(i)}
                data-testid={`popup-image-${i}`}
              />
            )}
          </div>
        );
      })}

      {visibleCount > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goTo(-1); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-colors shadow-lg z-10"
            aria-label="Previous"
            data-testid="popup-prev"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goTo(1); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition-colors shadow-lg z-10"
            aria-label="Next"
            data-testid="popup-next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-semibold backdrop-blur-sm shadow-md z-10" data-testid="popup-counter">
            {visibleIdx.indexOf(safeActive) + 1} / {visibleCount}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/55 backdrop-blur-sm shadow-md z-10">
            {visibleIdx.map((i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setActive(i); }}
                className={`rounded-full transition-all ${i === safeActive ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProductModal({ product, onClose }: { product: any; onClose: () => void }) {
  const { addToCart } = useCart();
  const price = parseFloat(product.price);

  const slides: Slide[] = useMemo(() => {
    const vids: Slide[] = (product.videos || [])
      .filter((u: any): u is string => typeof u === 'string' && u.length > 0)
      .map((url: string) => ({ url, type: 'video' as const }));
    const imgs: Slide[] = (product.images || [])
      .filter((u: any): u is string => typeof u === 'string' && u.length > 0)
      .map((url: string) => ({ url, type: 'image' as const }));
    return [...vids, ...imgs];
  }, [product.images, product.videos]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#F5EFE6] rounded-t-[2.5rem] sm:rounded-[2rem] w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300 overflow-hidden max-h-[95vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="overflow-y-auto flex-1 min-h-0">
          {slides.length > 0 && (
            <ProductMediaCarousel slides={slides} productName={product.name} />
          )}
          <div className="p-6 pb-8">
          <h2 className="text-2xl font-extrabold text-[#3E2723] mb-1">{product.name}</h2>
          {product.weight && (
            <p className="text-sm text-[#795548] mb-2">{product.weight}</p>
          )}
          {product.description && (
            <p className="text-sm text-[#5D4037] mb-5 leading-relaxed">{product.description}</p>
          )}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {product.tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-[#3E2723]/10 text-[#3E2723] px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-3xl font-extrabold text-[#3E2723]">{formatPrice(price)}</span>
            <div className="flex gap-3">
              <Link href={getProductUrl(product)}>
                <button className="border border-[#3E2723] text-[#3E2723] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#3E2723]/5 transition-colors">
                  Details
                </button>
              </Link>
              <button
                onClick={() => { addToCart(product.id, 1); onClose(); }}
                className="bg-[#3E2723] hover:bg-[#5D4037] text-[#F5EFE6] font-bold text-sm px-6 py-2.5 rounded-full shadow-lg transition-all flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/30 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function TrendingLocalPage() {
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/products/trending-local'],
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#3E2723' }}>
      <Header />

      <div className="pt-20 pb-32 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Back + Header */}
        <div className="flex items-center gap-3 mb-2 pt-2">
          <Link href="/">
            <button className="w-9 h-9 rounded-full bg-[#F5EFE6]/10 flex items-center justify-center hover:bg-[#F5EFE6]/20 transition-colors">
              <ArrowLeft className="h-4 w-4 text-[#F5EFE6]" />
            </button>
          </Link>
        </div>

        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-[#F5EFE6] text-[#3E2723] px-3 py-1 rounded-full inline-block mb-3">
            TOP PICKS
          </span>
          <h1 className="text-3xl font-black text-white leading-tight">Trending Local</h1>
          <p className="text-[#F5EFE6]/60 text-sm mt-1">What Prayagraj is loving right now</p>
        </div>

        {isLoading ? (
          <div className="columns-2 sm:columns-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="mb-4 break-inside-avoid bg-[#F5EFE6]/10 rounded-3xl animate-pulse" style={{ height: `${140 + (i % 4) * 30}px` }} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#F5EFE6]/60 text-lg">No trending local products yet.</p>
            <p className="text-[#F5EFE6]/40 text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 gap-3">
            {products.map((product, i) => (
              <MasonryCard
                key={product.id}
                product={product}
                index={i}
                onClick={() => setSelectedProduct(product)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}

      <MobileNav />
      <CartSidebar />
    </div>
  );
}
