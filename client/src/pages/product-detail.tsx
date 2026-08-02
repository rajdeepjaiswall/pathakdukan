import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Star, Plus, Minus, Heart, Share2, ShoppingCart, Play, Image, ChevronLeft, ChevronRight, CheckCircle, Quote, MessageSquare, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';
import MediaViewerModal from '@/components/product/media-viewer-modal';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { formatPrice } from '@/lib/cart';
import { getProductIdFromSlug, getProductUrl } from '@/lib/product-url';

function ProductReviews({ productId }: { productId: number }) {
  const { data: reviews = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/testimonials/product/${productId}`],
    enabled: !!productId && !isNaN(productId),
  });

  if (isLoading) {
    return (
      <div className="mt-12 text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700 mx-auto"></div>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-navy mb-6 flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-amber-700" />
          Customer Reviews
        </h2>
        <div className="bg-amber-50 rounded-2xl p-8 text-center border border-amber-100">
          <MessageSquare className="h-10 w-10 text-amber-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reviews yet</p>
          <p className="text-sm text-gray-400 mt-1">Be the first to review this product after purchasing!</p>
        </div>
      </div>
    );
  }

  const avgRating = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-navy flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-amber-700" />
          Customer Reviews
        </h2>
        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
          <div className="flex">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`h-4 w-4 ${s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
            ))}
          </div>
          <span className="font-bold text-navy">{avgRating.toFixed(1)}</span>
          <span className="text-sm text-gray-500">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
        </div>
      </div>
      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-800 text-sm shrink-0">
                  {(review.user_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy text-sm">{review.user_name || 'Customer'}</span>
                    {review.order_id && (
                      <span className="flex items-center gap-0.5 text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                        <CheckCircle className="h-3 w-3" /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
              </div>
              {review.approved_at && (
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(review.approved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <Quote className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
              <p className="text-gray-700 text-sm leading-relaxed">{review.review_text}</p>
            </div>
            {review.image_url && (
              <img src={review.image_url} alt="Review" className="mt-3 h-24 w-24 object-cover rounded-xl border border-gray-100" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id: rawId } = useParams();
  const id = rawId ? getProductIdFromSlug(rawId) : undefined;
  const [quantity, setQuantity] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist, isAdding, isRemoving } = useWishlist();
  const [heartAnim, setHeartAnim] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Always start the product page at the very top, regardless of where the
  // user navigated from (homepage card, modal popup, search, etc.)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id]);

  const { data: product, isLoading } = useQuery<any>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const inWishlist = product ? isInWishlist(product.id) : false;

  const handleHeartClick = () => {
    if (!product) return;
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 400);
    toggleWishlist(product.id);
  };

  const handleShare = async () => {
    if (!product) return;
    const url = `${window.location.origin}${getProductUrl(product)}`;
    const shareData = {
      title: product.name,
      text: product.description,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('Share failed:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Product link copied to clipboard!');
      } catch {
        alert('Could not copy link. Please copy the URL manually.');
      }
    }
  };

  const mediaItems = (() => {
    if (!product) return [];
    const photos = (product.images || []).filter((url: string) => url && url.trim()).map((url: string) => ({ type: 'image' as const, url }));
    const videos = (product.videos || []).filter((url: string) => url && url.trim()).map((url: string) => ({ type: 'video' as const, url }));
    return [...videos, ...photos];
  })();

  useEffect(() => {
    if (mediaItems.length <= 1 || viewerOpen) return;

    const currentMedia = mediaItems[currentIndex];

    if (currentMedia?.type === 'image') {
      const timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, mediaItems.length, viewerOpen]);

  // Pause inline video when opening the modal so audio doesn't double up
  useEffect(() => {
    if (viewerOpen && videoRef.current) {
      try { videoRef.current.pause(); } catch {}
    }
  }, [viewerOpen]);

  const handleVideoEnd = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const goToIndex = (i: number) => {
    setCurrentIndex(i);
  };
  const goPrev = () => {
    if (mediaItems.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };
  const goNext = () => {
    if (mediaItems.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const onMediaTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };
  const onMediaTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) goPrev();
      else goNext();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="h-96 bg-gray-200 rounded-lg" />
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-20 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-navy mb-4">Product Not Found</h1>
            <p className="text-gray-600">The product you're looking for doesn't exist.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div
              className="relative rounded-lg overflow-hidden bg-white shadow-lg group flex items-center justify-center min-h-[280px]"
              onTouchStart={onMediaTouchStart}
              onTouchEnd={onMediaTouchEnd}
              data-testid="product-media-container"
            >
              {mediaItems.length > 0 ? (
                mediaItems[currentIndex].type === 'video' ? (
                  <div className="relative w-full h-auto max-h-[70vh] bg-black flex items-center justify-center">
                    <video
                      ref={videoRef}
                      key={mediaItems[currentIndex].url}
                      src={mediaItems[currentIndex].url}
                      autoPlay
                      muted
                      onEnded={handleVideoEnd}
                      onClick={() => setViewerOpen(true)}
                      playsInline
                      className="block w-full h-auto max-h-[70vh] object-contain cursor-zoom-in"
                      data-testid="product-video"
                    />
                    {/* Click-to-play overlay when autoplay is blocked and video is paused */}
                    <div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      onClick={(e) => { e.stopPropagation(); setViewerOpen(true); }}
                    >
                      <div className="w-14 h-14 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg pointer-events-auto cursor-pointer transition-colors">
                        <Play className="w-6 h-6 text-navy ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={mediaItems[currentIndex].url}
                    alt={product.name}
                    onClick={() => setViewerOpen(true)}
                    className="block w-full h-auto max-h-[70vh] object-contain cursor-zoom-in"
                    data-testid="product-image"
                  />
                )
              ) : (
                <img
                  src="/placeholder-product.jpg"
                  alt={product.name}
                  className="block w-full h-auto max-h-[70vh] object-contain"
                />
              )}

              {mediaItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewerOpen(true)}
                  className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                  aria-label="View full screen"
                  data-testid="button-open-viewer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}

              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Previous"
                    data-testid="button-media-prev"
                  >
                    <ChevronLeft className="w-6 h-6 text-navy" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label="Next"
                    data-testid="button-media-next"
                  >
                    <ChevronRight className="w-6 h-6 text-navy" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {mediaItems.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentIndex ? 'bg-champagne w-4' : 'bg-white/70 w-2 hover:bg-white'
                        }`}
                        aria-label={`Go to media ${index + 1}`}
                        data-testid={`button-media-dot-${index}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {mediaItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {mediaItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => goToIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentIndex === index ? 'border-champagne ring-2 ring-champagne/30' : 'border-gray-200'
                    }`}
                    data-testid={`button-media-thumb-${index}`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-navy flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" fill="white" />
                      </div>
                    ) : (
                      <img src={item.url} className="w-full h-full object-cover" alt="" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {product.featured && (
                  <Badge className="bg-champagne text-navy">Bestseller</Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold text-navy mb-4">{product.name}</h1>
              <p className="text-gray-600 text-lg">{product.description}</p>
            </div>
            {(() => {
              const variants = product.weightVariants || [];
              const hasVariants = variants.length > 0;
              const activeVariant = hasVariants ? variants[selectedVariantIndex] : null;
              const displayPrice = activeVariant ? activeVariant.price : parseFloat(product.price);
              const displayWeight = activeVariant ? activeVariant.weight : product.weight;

              return (
                <>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-navy">
                        {formatPrice(displayPrice)}
                      </span>
                      {!hasVariants && displayWeight && (
                        <span className="text-gray-500">/ {displayWeight}</span>
                      )}
                    </div>
                    <p className="text-green-600 text-sm">
                      + {formatPrice(displayPrice * parseFloat(product.gstRate) / 100)} GST included
                    </p>
                  </div>

                  {hasVariants && (
                    <div className="space-y-2">
                      <span className="font-medium text-navy">Select Weight:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {variants.map((v: { weight: string; price: number }, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedVariantIndex(idx)}
                            className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                              selectedVariantIndex === idx
                                ? 'border-champagne bg-champagne/10 text-navy'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-champagne/50'
                            }`}
                          >
                            {v.weight} — {formatPrice(v.price)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="font-medium text-navy">Quantity:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`p-3 transition-transform ${heartAnim ? 'scale-125' : 'scale-100'}`}
                        onClick={handleHeartClick}
                        disabled={isAdding || isRemoving}
                        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            inWishlist
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400 hover:text-red-400'
                          }`}
                        />
                      </Button>
                      <Button
                        onClick={() => {
                          if (activeVariant) {
                            addToCart(product.id, quantity, activeVariant.weight, activeVariant.price);
                          } else {
                            addToCart(product.id, quantity);
                          }
                        }}
                        className="flex-1 bg-champagne text-navy hover:bg-champagne/90"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="p-3"
                        onClick={handleShare}
                        title="Share this product"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {!(product.weightVariants?.length > 0) && (
                    <div>
                      <span className="font-medium text-navy">Weight:</span>
                      <p className="text-gray-600">{product.weight || 'N/A'}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-navy">GST Rate:</span>
                    <p className="text-gray-600">{product.gstRate}%</p>
                  </div>
                  <div>
                    <span className="font-medium text-navy">HSN Code:</span>
                    <p className="text-gray-600">{product.hsnCode || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-navy">Stock:</span>
                    <p className="text-gray-600">{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-gray-600">{product.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ingredients" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  {product.ingredients && product.ingredients.length > 0 ? (
                    <ul className="space-y-2">
                      {product.ingredients.map((ingredient: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-champagne font-bold mt-1">•</span>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No ingredients listed</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Customer Reviews Section */}
        <ProductReviews productId={parseInt(id!)} />
      </div>
      <Footer />
      <MobileNav />
      <CartSidebar />
      {viewerOpen && mediaItems.length > 0 && (
        <MediaViewerModal
          items={mediaItems}
          index={currentIndex}
          onIndexChange={setCurrentIndex}
          onClose={() => setViewerOpen(false)}
          alt={product.name}
        />
      )}
    </div>
  );
}
