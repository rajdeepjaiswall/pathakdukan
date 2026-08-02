import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { getProductUrl } from '@/lib/product-url';
import { formatPrice } from '@/lib/cart';

function ChefCard({ product, imageRight }: { product: any; imageRight: boolean }) {
  const { addToCart } = useCart();
  const image = product.images?.[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80';
  const price = parseFloat(product.price);

  return (
    <div
      className={`relative rounded-3xl overflow-hidden h-56 sm:h-64 lg:h-72 cursor-pointer group transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
      style={{ backgroundColor: '#1a1209' }}
    >
      {/* Background Image */}
      <img
        src={image}
        alt={product.name}
        className={`absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300 ${imageRight ? 'object-right' : 'object-left'}`}
      />
      {/* Dark gradient overlay on image side */}
      <div className={`absolute inset-0 ${imageRight ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black/60 via-black/10 to-transparent`} />

      {/* Floating Glass Card */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${imageRight ? 'left-4' : 'right-4'} w-48 sm:w-52 lg:w-60`}
      >
        <div className="bg-white/90 backdrop-blur-md rounded-[1.5rem] shadow-xl p-4 sm:p-5">
          <h3 className="text-base sm:text-lg lg:text-xl font-extrabold text-gray-900 mb-1 leading-tight">
            {product.name}
          </h3>
          <p className="text-xs lg:text-sm text-gray-500 italic mb-3 leading-snug line-clamp-3">
            "{product.description || 'Our chef\'s signature creation, made with the finest ingredients.'}"
          </p>
          <div className={`flex items-center ${imageRight ? 'justify-between' : 'flex-row-reverse justify-between'} gap-2`}>
            <button
              onClick={(e) => { e.stopPropagation(); addToCart(product.id, 1); }}
              className="bg-amber-800 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all duration-200 shadow"
            >
              Order
            </button>
            <span className="text-amber-800 font-extrabold text-base">
              {formatPrice(price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChefEditorial() {
  const { data: chefSpecials = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/products/chef-specials'],
  });

  if (isLoading) return null;
  if (!chefSpecials || chefSpecials.length === 0) return null;

  const mobileProducts = chefSpecials.slice(0, 2);
  const desktopProducts = chefSpecials.slice(0, 4);

  return (
    <section className="py-8 lg:py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f0eb]">
      <div className="max-w-[1400px] mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5 lg:mb-8">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900">Chef's Editorial</h2>
          <span className="hidden lg:inline-block text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
            Handpicked Specials
          </span>
        </div>

        {/* Mobile only: 2 cards stacked */}
        <div className="flex flex-col gap-4 md:hidden">
          {mobileProducts.map((product, index) => (
            <Link key={product.id} href={getProductUrl(product)}>
              <ChefCard
                product={product}
                imageRight={index % 2 === 0}
              />
            </Link>
          ))}
        </div>

        {/* Tablet+Desktop: 2×2 grid for up to 4 cards */}
        <div className="hidden md:grid md:grid-cols-2 gap-5">
          {desktopProducts.map((product, index) => (
            <Link key={product.id} href={getProductUrl(product)}>
              <ChefCard
                product={product}
                imageRight={index % 2 === 0}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
