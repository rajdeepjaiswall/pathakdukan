import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/cart';
import { getProductUrl } from '@/lib/product-url';
import { useState } from 'react';

const BADGE_OPTIONS = ['BEST SELLER', 'MUST TRY', 'TRENDING', 'FAN FAV', 'LIMITED'];

function getBadge(index: number) {
  return BADGE_OPTIONS[index % BADGE_OPTIONS.length];
}

function PinterestCard({ product, index, onClick }: { product: any; index: number; onClick: () => void }) {
  const { addToCart } = useCart();
  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80';
  const price = parseFloat(product.price);

  const heights = ['h-48', 'h-56', 'h-44', 'h-64', 'h-52', 'h-40', 'h-48', 'h-60'];
  const imgHeight = heights[index % heights.length];

  return (
    <div
      className="mb-3 lg:mb-4 break-inside-avoid bg-[#F5EFE6] rounded-3xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className={`relative ${imgHeight} overflow-hidden rounded-t-3xl`}>
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
        <div className="flex items-center justify-between mt-2">
          <span className="text-[#3E2723] font-extrabold text-base">{formatPrice(price)}</span>
          <button
            onClick={(e) => { e.stopPropagation(); addToCart(product.id, 1); }}
            className="w-8 h-8 rounded-full bg-[#3E2723] hover:bg-[#5D4037] active:scale-95 flex items-center justify-center shadow transition-all duration-200"
          >
            <ShoppingCart className="h-3.5 w-3.5 text-[#F5EFE6]" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrendingSection() {
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/products/trending-local'],
    queryFn: () => fetch('/api/products/trending-local?limit=12').then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); }),
  });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { addToCart } = useCart();

  if (isLoading) return null;
  if (!products || !Array.isArray(products) || products.length === 0) return null;

  const display = products.slice(0, 12);

  return (
    <>
      <section className="py-6 lg:py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div
            className="rounded-[2.5rem] lg:rounded-[3rem] py-8 lg:py-10 px-6 lg:px-10 shadow-2xl"
            style={{ backgroundColor: '#3E2723' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6 lg:mb-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-[#F5EFE6] text-[#3E2723] px-3 py-1 rounded-full inline-block mb-2">
                  TOP PICKS
                </span>
                <h2 className="text-2xl lg:text-3xl font-black text-white leading-tight">Trending Local</h2>
              </div>
              <Link href="/trending-local">
                <span className="text-[#F5EFE6]/80 text-xs underline underline-offset-2 mt-1 block hover:text-[#F5EFE6] transition-colors">
                  Explore All
                </span>
              </Link>
            </div>

            {/* Pinterest Masonry Grid — 2 cols mobile, 3 cols tablet, 4 cols desktop */}
            <div className="columns-2 md:columns-3 lg:columns-4 gap-3 md:gap-4">
              {display.map((product, i) => (
                <PinterestCard
                  key={product.id}
                  product={product}
                  index={i}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          onClick={() => setSelectedProduct(null)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-[#F5EFE6] rounded-t-[2rem] w-full max-w-lg p-6 pb-10 animate-in slide-in-from-bottom duration-300 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {selectedProduct.images?.[0] && (
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.name}
                className="w-full h-52 object-cover rounded-2xl mb-4"
              />
            )}
            <h3 className="text-xl font-extrabold text-[#3E2723] mb-1">{selectedProduct.name}</h3>
            {selectedProduct.description && (
              <p className="text-sm text-[#5D4037] mb-4 line-clamp-3">{selectedProduct.description}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-[#3E2723]">
                {formatPrice(parseFloat(selectedProduct.price))}
              </span>
              <button
                onClick={() => { addToCart(selectedProduct.id, 1); setSelectedProduct(null); }}
                className="bg-[#3E2723] hover:bg-[#5D4037] text-[#F5EFE6] font-bold text-sm px-6 py-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#3E2723]/10 flex items-center justify-center text-[#3E2723] hover:bg-[#3E2723]/20"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
