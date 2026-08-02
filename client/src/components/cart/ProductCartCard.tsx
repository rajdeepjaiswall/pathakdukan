import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, getItemPrice } from '@/lib/cart';
import QuantitySelector from './QuantitySelector';
import VariationChip from './VariationChip';
import type { CartItem } from '@/lib/cart';

interface FullProduct {
  id: number;
  name: string;
  description?: string;
  price: string;
  weight: string;
  images: string[];
  gstRate: string;
  weightVariants?: { weight: string; price: number }[];
}

interface ProductCartCardProps {
  item: CartItem;
  layout?: 'page' | 'sidebar';
}

export default function ProductCartCard({ item, layout = 'page' }: ProductCartCardProps) {
  const { updateQuantity, removeFromCart, addToCart } = useCart();
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = useState(false);

  const isSidebar = layout === 'sidebar';

  const { data: fullProduct } = useQuery<FullProduct>({
    queryKey: ['/api/products', item.product_id],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/products/${item.product_id}`);
      return res.json();
    },
    enabled: !!item.product_id,
  });

  const variants = fullProduct?.weightVariants || [];
  const currentVariant = item.selectedWeight || item.product.weight || '';
  const currentPrice = getItemPrice(item);
  const itemTotal = currentPrice * item.quantity;
  const gstPerItem = currentPrice * (parseFloat(item.product.gstRate) / 100);
  const gstTotal = gstPerItem * item.quantity;

  const handleQuantityChange = (newQty: number) => {
    if (newQty < 1) return;
    updateQuantity(item.id, newQty);
  };

  const handleVariantChange = (variantWeight: string, variantPrice: number) => {
    if (variantWeight === currentVariant) return;
    removeFromCart(item.id);
    addToCart(item.product_id, item.quantity, variantWeight, variantPrice);
    toast({
      title: 'Variant updated',
      description: `Switched to ${variantWeight}`,
    });
  };

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => removeFromCart(item.id), 200);
  };

  const productName = item.product.name;
  const productImage = item.product.images[0] || '/placeholder-product.jpg';

  if (isSidebar) {
    return (
      <div
        className={`
          flex gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3
          transition-all duration-200 hover:shadow-md
          ${isRemoving ? 'opacity-0 scale-95 translate-x-4' : 'opacity-100 scale-100 translate-x-0'}
        `}
      >
        <img
          src={productImage}
          alt={productName}
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-50"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm text-gray-900 leading-tight truncate">
              {productName}
            </h4>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors p-0.5 flex-shrink-0"
              aria-label="Remove item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          {currentVariant && (
            <p className="text-xs text-gray-500 mt-0.5">{currentVariant}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <QuantitySelector
              quantity={item.quantity}
              onDecrease={() => handleQuantityChange(item.quantity - 1)}
              onIncrease={() => handleQuantityChange(item.quantity + 1)}
              isCompact
            />
            <span className="font-bold text-sm text-gray-900">
              {formatPrice(itemTotal)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-[20px] border border-gray-100 shadow-sm p-4 sm:p-5
        transition-all duration-200 hover:shadow-md
        ${isRemoving ? 'opacity-0 scale-95 translate-x-6' : 'opacity-100 scale-100 translate-x-0'}
      `}
    >
      <div className="flex gap-4 sm:gap-5">
        {/* Left: Product Image */}
        <div className="flex-shrink-0">
          <img
            src={productImage}
            alt={productName}
            className="w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-2xl object-cover bg-gray-50"
            loading="lazy"
          />
        </div>

        {/* Right: Product Details */}
        <div className="flex-1 min-w-0">
          {/* Top row: Name + Remove button */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[#1f2937] leading-snug line-clamp-2">
                {productName}
              </h3>
              {variants.length === 0 && currentVariant && (
                <p className="text-xs text-gray-500 mt-1">
                  Weight / Pack Size
                </p>
              )}
            </div>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 flex-shrink-0"
              aria-label="Remove item"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Variation Chips */}
          {variants.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500 mb-1.5">Weight / Pack Size</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <VariationChip
                    key={variant.weight}
                    label={variant.weight}
                    isActive={variant.weight === currentVariant}
                    onClick={() => handleVariantChange(variant.weight, variant.price)}
                  />
                ))}
              </div>
            </div>
          )}
          {variants.length === 0 && currentVariant && (
            <div className="mt-2">
              <VariationChip
                label={currentVariant}
                isActive={true}
                onClick={() => {}}
                disabled
              />
            </div>
          )}

          {/* Price + Quantity row */}
          <div className="mt-3 sm:mt-4 flex flex-wrap items-end justify-between gap-3">
            {/* Price */}
            <div className="flex-1 min-w-0">
              <p className="text-lg sm:text-xl font-bold text-[#1f2937]">
                {formatPrice(itemTotal)}
              </p>
              <p className="text-xs text-[#16a34a] font-medium">
                + {formatPrice(gstTotal)} GST Included
              </p>
            </div>

            {/* Quantity Selector */}
            <QuantitySelector
              quantity={item.quantity}
              onDecrease={() => handleQuantityChange(item.quantity - 1)}
              onIncrease={() => handleQuantityChange(item.quantity + 1)}
            />

            {/* Total price for this item (right side) */}
            <div className="text-right min-w-[80px]">
              <p className="text-lg font-bold text-[#1f2937]">
                {formatPrice(itemTotal)}
              </p>
              <p className="text-xs text-gray-500">Total Price</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
