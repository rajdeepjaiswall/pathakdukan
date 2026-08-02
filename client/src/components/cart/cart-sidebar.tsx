import { X, ShoppingBag, Shield, Truck, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { chargeMethodSuffix, formatPrice, getGSTBreakdown } from '@/lib/cart';
import { Link } from 'wouter';
import ProductCartCard from './ProductCartCard';

export default function CartSidebar() {
  const { isOpen, closeCart, items, summary } = useCart();

  if (!isOpen) return null;

  const gstBreakdown = getGSTBreakdown(items);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={closeCart} />
      <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-[#faf8f5] shadow-xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Cart Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Shopping Cart</h3>
            <button
              onClick={closeCart}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close cart"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 mb-6">Your cart is empty</p>
                <Link href="/products">
                  <Button className="bg-champagne text-navy hover:bg-champagne/90" onClick={closeCart}>
                    Start Shopping
                  </Button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <ProductCartCard key={item.id} item={item} layout="sidebar" />
              ))
            )}
          </div>

          {/* Cart Summary */}
          {items.length > 0 && (
            <div className="bg-white border-t border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <ListChecks className="w-4 h-4 text-gray-500" />
                <h4 className="font-bold text-sm text-gray-900">Order Summary</h4>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({summary.itemCount} items)</span>
                <span className="font-medium text-gray-900">{formatPrice(summary.subtotal)}</span>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">CGST (2.5%)</span>
                  <span className="font-medium text-gray-900">{formatPrice(gstBreakdown.cgst)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">SGST (2.5%)</span>
                  <span className="font-medium text-gray-900">{formatPrice(gstBreakdown.sgst)}</span>
                </div>
              </div>

              {summary.deliveryActive && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery{chargeMethodSuffix(summary.deliveryMethod, summary.deliveryPercentage, summary.deliveryCharge)}</span>
                  <span className="font-bold text-[#16a34a]">
                    {summary.deliveryCharge === 0 ? 'FREE' : formatPrice(summary.deliveryCharge)}
                  </span>
                </div>
              )}

              {summary.handlingActive && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Handling{chargeMethodSuffix(summary.handlingMethod, summary.handlingPercentage, summary.handlingCharge)}</span>
                  <span className="font-bold text-[#16a34a]">
                    {summary.handlingCharge === 0 ? 'FREE' : formatPrice(summary.handlingCharge)}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-base text-gray-900">Total</span>
                  <span className="font-bold text-xl text-[#9B2335]">{formatPrice(summary.total)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Inclusive of all taxes</p>
              </div>

              {summary.deliveryActive && summary.deliveryCharge === 0 && (
                <div className="bg-[#ecfdf5] rounded-lg p-2.5 flex items-center gap-2 text-sm text-[#16a34a]">
                  <Truck className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Yay! You get FREE delivery on this order</span>
                </div>
              )}

              <Link href="/checkout">
                <Button
                  className="w-full bg-champagne text-navy py-3 hover:bg-champagne/90 font-semibold"
                  onClick={closeCart}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>
              </Link>

              <div className="text-center text-xs text-gray-400">
                <Shield className="h-3 w-3 inline mr-1" />
                Secure checkout with SSL encryption
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
