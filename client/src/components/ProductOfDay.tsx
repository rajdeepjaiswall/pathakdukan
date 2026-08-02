import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/cart';
import { useState, useEffect } from 'react';

function useCountdown() {
  const getTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return { h, m, s };
  };

  const [time, setTime] = useState(getTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function StarRating({ rating = 4.5 }: { rating?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-5 w-5 ${i <= full ? 'fill-amber-400 text-amber-400' : i === full + 1 && half ? 'fill-amber-200 text-amber-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className="text-sm text-gray-500 font-medium ml-1">{rating} / 5</span>
    </div>
  );
}

export default function ProductOfDay() {
  const { data: product, isLoading } = useQuery<any>({
    queryKey: ['/api/products/product-of-day'],
  });
  const { addToCart } = useCart();
  const countdown = useCountdown();

  if (isLoading) return null;
  if (!product) return null;

  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=90';
  const price = parseFloat(product.price);
  const originalPrice = Math.round(price * 1.3);
  const savePercent = Math.round((1 - price / originalPrice) * 100);

  return (
    <section className="py-8 lg:py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f0eb]">
      <div className="max-w-[1400px] mx-auto">

        {/* ── MOBILE: stacked card (under 768px) ── */}
        <div className="md:hidden bg-white rounded-[2.5rem] shadow-xl overflow-hidden">
          <div className="relative">
            <img src={image} alt={product.name} className="w-full h-72 object-cover" />
            <div className="absolute top-4 left-4">
              <span className="bg-red-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md">
                Deal of the Day
              </span>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="bg-white/80 backdrop-blur-md rounded-full px-5 py-2 shadow-lg flex items-center gap-3 whitespace-nowrap">
                <span className="text-xs text-gray-500 font-medium leading-tight">ENDS<br />IN</span>
                <span className="text-base font-bold text-gray-800 tracking-widest">
                  {pad(countdown.h)} : {pad(countdown.m)} : {pad(countdown.s)}
                </span>
              </div>
            </div>
          </div>
          <div className="px-6 pt-5 pb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 leading-tight mb-1">{product.name}</h2>
            <p className="text-gray-500 text-sm mb-4 line-clamp-2">
              {product.description || 'Handcrafted with premium ingredients, made fresh daily.'}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-extrabold text-gray-900">{formatPrice(price)}</span>
                <span className="text-base text-gray-400 line-through font-medium">{formatPrice(originalPrice)}</span>
              </div>
              <button
                onClick={() => addToCart(product.id, 1)}
                className="w-12 h-12 rounded-full bg-amber-800 hover:bg-amber-700 active:scale-95 flex items-center justify-center shadow-lg transition-all duration-200"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ── TABLET+DESKTOP: big photo left + editorial content right ── */}
        <div className="hidden md:flex rounded-[2.5rem] shadow-2xl overflow-hidden bg-white min-h-[480px]">

          {/* Left — Full-bleed hero photo (3/5 width) */}
          <div className="relative w-3/5 flex-shrink-0">
            <img
              src={image}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark gradient on right edge for smooth transition */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/10" />

            {/* DEAL badge */}
            <div className="absolute top-6 left-6">
              <span className="bg-red-600 text-white text-xs font-black uppercase tracking-widest px-5 py-2 rounded-full shadow-lg">
                Deal of the Day
              </span>
            </div>

            {/* Countdown bottom-left */}
            <div className="absolute bottom-6 left-6">
              <div className="bg-black/50 backdrop-blur-md rounded-2xl px-6 py-3 shadow-xl flex items-center gap-4 whitespace-nowrap">
                <div className="text-center">
                  <p className="text-white/60 text-[10px] uppercase tracking-widest">Ends in</p>
                  <p className="text-white text-xl font-black tracking-widest">
                    {pad(countdown.h)}<span className="text-white/40 mx-1">:</span>{pad(countdown.m)}<span className="text-white/40 mx-1">:</span>{pad(countdown.s)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Content (2/5 width) */}
          <div className="flex-1 flex flex-col justify-center px-12 py-14 bg-white">
            <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full inline-block mb-6 w-fit">
              ⭐ Today's Special Pick
            </span>

            <h2 className="text-4xl xl:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
              {product.name}
            </h2>

            {/* Star Rating */}
            <div className="mb-4">
              <StarRating rating={4.5} />
              <p className="text-xs text-gray-400 mt-1">Based on customer reviews</p>
            </div>

            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-sm">
              {product.description || 'Handcrafted daily with the finest ingredients. A crowd favourite straight from our master baker\'s kitchen.'}
            </p>

            {/* Price row */}
            <div className="flex items-end gap-4 mb-8">
              <span className="text-4xl font-extrabold text-gray-900">{formatPrice(price)}</span>
              <div className="flex flex-col mb-1">
                <span className="text-lg text-gray-400 line-through font-medium">{formatPrice(originalPrice)}</span>
                <span className="bg-green-100 text-green-700 text-sm font-bold px-2 py-0.5 rounded-full w-fit">
                  Save {savePercent}%
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={() => addToCart(product.id, 1)}
              className="flex items-center gap-3 bg-[#6B3E2E] hover:bg-[#8B5E3C] active:scale-95 text-white font-black text-base px-10 py-4 rounded-2xl shadow-lg transition-all duration-200 w-fit"
            >
              <ShoppingCart className="h-5 w-5" />
              Add to Cart — {formatPrice(price)}
            </button>

            <p className="text-xs text-gray-400 mt-4">Free delivery on orders above ₹500</p>
          </div>
        </div>

      </div>
    </section>
  );
}
