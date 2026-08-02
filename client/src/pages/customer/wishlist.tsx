import { useState } from 'react';
import { Heart, ShoppingCart, Trash2, ArrowLeft, CheckSquare, Square, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { getProductUrl } from '@/lib/product-url';

export default function CustomerWishlist() {
  const { addToCart } = useCart();
  const { wishlistItems, removeFromWishlist, isLoading } = useWishlist();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [addingBulk, setAddingBulk] = useState(false);

  const handleAddToCart = (productId: number) => {
    addToCart(productId, 1);
  };

  const handleRemoveFromWishlist = (productId: number) => {
    removeFromWishlist(productId);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const toggleSelect = (productId: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === wishlistItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(wishlistItems.map((item: any) => item.product.id)));
    }
  };

  const handleAddSelectedToCart = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to add to cart.',
        variant: 'destructive',
      });
      return;
    }
    setAddingBulk(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      addToCart(id, 1);
      await new Promise(r => setTimeout(r, 100));
    }
    setAddingBulk(false);
    setSelectedIds(new Set());
    toast({
      title: 'Added to cart',
      description: `${ids.length} item${ids.length > 1 ? 's' : ''} added to your cart.`,
    });
  };

  const allSelected = wishlistItems.length > 0 && selectedIds.size === wishlistItems.length;

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-8">
        {/* Navigation Bar */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Go to Cart
            </Button>
          </Link>
        </div>
        
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-1 flex items-center gap-3">
              <Heart className="h-8 w-8 fill-red-500 text-red-500" />
              My Favorites
            </h1>
            <p className="text-gray-600">
              {wishlistItems.length > 0 ? `${wishlistItems.length} saved item${wishlistItems.length > 1 ? 's' : ''}` : 'Your saved favorites'}
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-navy font-medium hover:text-champagne transition-colors"
              >
                {allSelected ? (
                  <CheckSquare className="h-5 w-5 text-champagne" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>

              {selectedIds.size > 0 && (
                <Button
                  onClick={handleAddSelectedToCart}
                  disabled={addingBulk}
                  className="bg-champagne text-navy hover:bg-champagne/90 font-semibold flex items-center gap-2"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Add Selected ({selectedIds.size}) to Cart
                </Button>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-8 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">Your favorites list is empty</h2>
            <p className="text-gray-500 mb-2">Add products you love by clicking the heart icon on any product</p>
            <p className="text-gray-400 text-sm mb-6">Tip: Double-tap any product card to quickly add it to favorites</p>
            <Link href="/products">
              <Button className="bg-champagne text-navy hover:bg-champagne/90">
                Explore Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {wishlistItems.map((item: any) => {
              const product = item.product;
              const isSelected = selectedIds.has(product.id);

              return (
                <Card
                  key={product.id}
                  className={`group overflow-hidden hover:shadow-lg transition-all duration-300 relative ${
                    isSelected ? 'ring-2 ring-champagne shadow-md' : ''
                  }`}
                >
                  {/* Checkbox overlay */}
                  <div
                    className="absolute top-2 left-2 z-10 cursor-pointer"
                    onClick={() => toggleSelect(product.id)}
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isSelected ? 'bg-champagne border-2 border-champagne' : 'bg-white/90 border-2 border-gray-300 hover:border-champagne'
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="relative h-44 bg-gray-100">
                    <img
                      src={product.images?.[0] || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Remove from wishlist */}
                    <button
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-md hover:bg-red-50 transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                    {/* Heart badge */}
                    <div className="absolute bottom-2 right-2">
                      <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-navy mb-1 text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    {product.weight && (
                      <p className="text-xs text-gray-500 mb-2">{product.weight}</p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-base font-bold text-champagne">
                        ₹{parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.featured && (
                        <Badge className="bg-champagne/20 text-champagne text-xs">Best Seller</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(product.id)}
                        className="flex-1 bg-champagne text-navy hover:bg-champagne/90"
                        size="sm"
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                        Add to Cart
                      </Button>
                      <Link href={getProductUrl(product)}>
                        <Button variant="outline" size="sm" className="border-champagne text-navy hover:bg-champagne/10 px-3">
                          View
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bottom sticky bar for bulk actions on mobile */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-champagne/30 shadow-lg p-3 z-30 md:hidden">
            <Button
              onClick={handleAddSelectedToCart}
              disabled={addingBulk}
              className="w-full bg-champagne text-navy hover:bg-champagne/90 font-bold py-3 flex items-center gap-2 justify-center"
            >
              <ShoppingBag className="h-5 w-5" />
              Add {selectedIds.size} Selected Item{selectedIds.size > 1 ? 's' : ''} to Cart
            </Button>
          </div>
        )}
      </div>

      <Footer />
      <MobileNav />
      <CartSidebar />
    </div>
  );
}
