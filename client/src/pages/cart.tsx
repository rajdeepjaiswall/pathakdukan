import { Link } from 'wouter';
import { ShoppingBag, ArrowLeft, ListChecks, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { useCart } from '@/hooks/use-cart';
import { chargeMethodSuffix, formatPrice, getGSTBreakdown } from '@/lib/cart';
import ProductCartCard from '@/components/cart/ProductCartCard';

export default function Cart() {
  const { items, summary } = useCart();

  const gstBreakdown = getGSTBreakdown(items);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-8" />
            <h1 className="text-3xl font-bold text-navy mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet.</p>
            <Link href="/products">
              <Button className="bg-champagne text-navy hover:bg-champagne/90">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/products">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <ProductCartCard key={item.id} item={item} layout="page" />
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 rounded-[20px] border border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gray-900 text-base">
                  <ListChecks className="w-4 h-4 text-gray-500" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
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
                  <Button className="w-full bg-champagne text-navy hover:bg-champagne/90 py-3 font-semibold">
                    Proceed to Checkout
                  </Button>
                </Link>

                <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                  <Shield className="w-3 h-3" />
                  Secure checkout with SSL encryption
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
      <MobileNav />
    </div>
  );
}
