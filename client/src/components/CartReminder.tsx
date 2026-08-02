import { ShoppingCart, ArrowRight, Package } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice } from '@/lib/cart';

export default function CartReminder() {
  const { items, summary } = useCart();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || items.length === 0) return null;

  const userName = (user as any)?.firstName 
    ? `${(user as any).firstName} ${(user as any)?.lastName || ''}`.trim()
    : user?.username;

  const previewItems = items.slice(0, 3);

  return (
    <section className="py-4 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-amber-50 via-cream to-almond border-y border-champagne/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Left: Greeting + Cart Info */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-champagne rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShoppingCart className="h-6 w-6 text-navy" />
            </div>
            <div>
              <p className="text-navy font-bold text-base">
                {userName
                  ? `Hello ${userName}! You have ${summary.itemCount} item${summary.itemCount !== 1 ? 's' : ''} in your cart.`
                  : `You have ${summary.itemCount} item${summary.itemCount !== 1 ? 's' : ''} in your cart.`}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Total: <span className="font-semibold text-champagne">{formatPrice(summary.subtotal)}</span>
                {summary.subtotal < 500 && (
                  <span className="ml-2 text-orange-600 text-xs">
                    (Add {formatPrice(500 - summary.subtotal)} more for free delivery!)
                  </span>
                )}
                {summary.subtotal >= 500 && (
                  <span className="ml-2 text-green-600 text-xs font-medium">🎉 Free delivery unlocked!</span>
                )}
              </p>

              {/* Cart items preview */}
              <div className="flex items-center gap-2 flex-wrap">
                {previewItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-1.5 bg-white/70 rounded-lg px-2 py-1 text-xs border border-almond">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product?.name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    ) : (
                      <Package className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-navy font-medium truncate max-w-[80px]">
                      {item.product?.name || 'Item'}
                    </span>
                    <span className="text-gray-500">×{item.quantity}</span>
                  </div>
                ))}
                {items.length > 3 && (
                  <span className="text-xs text-gray-500 bg-white/70 rounded-lg px-2 py-1 border border-almond">
                    +{items.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Checkout Button */}
          <Link href="/checkout" className="flex-shrink-0">
            <Button className="bg-navy text-cream hover:bg-navy/90 font-bold px-6 py-3 flex items-center gap-2 shadow-md">
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
