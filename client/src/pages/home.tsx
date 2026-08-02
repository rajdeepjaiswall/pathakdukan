import { Link } from 'wouter';
import { ArrowRight, Truck, Smartphone, Award, Clock } from 'lucide-react';
import EventInquiryBanner from '@/components/EventInquiryBanner';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';
import ProductCard from '@/components/product/product-card';
import BannerSlideshow from '@/components/banner-slideshow';
import CategoryShowcase from '@/components/category-showcase';
import { MiniBannerSlideshow } from '@/components/mini-banner-slideshow';
import CartReminder from '@/components/CartReminder';
import FreshSection from '@/components/FreshSection';
import TrendingSection from '@/components/TrendingSection';
import ProductOfDay from '@/components/ProductOfDay';
import ChefEditorial from '@/components/ChefEditorial';
import Testimonials from '@/components/Testimonials';
import CollapsibleSection from '@/components/CollapsibleSection';

import { useAuth } from '@/hooks/use-auth';
import { CATEGORIES } from '@/lib/constants';
import { preloadImages } from '@/lib/image-cache';
import { useEffect } from 'react';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  useEffect(() => {
    const products = allProducts as any[];
    if (products && products.length > 0) {
      const imagesToPreload = products
        .slice(0, 8)
        .flatMap((product: any) => product.images || [])
        .filter((img: string) => img && !img.startsWith('data:'));
      
      if (imagesToPreload.length > 0) {
        preloadImages(imagesToPreload, 'high').catch(console.warn);
      }
    }
  }, [allProducts]);

  const featuredProducts = (allProducts as any[]).filter((product: any) => product.featured).length > 0
    ? (allProducts as any[]).filter((product: any) => product.featured)
    : (allProducts as any[]);

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: previouslyOrderedProducts = [] } = useQuery({
    queryKey: ['/api/previously-ordered'],
    enabled: isAuthenticated,
  });

  if (productsLoading && (allProducts as any[]).length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 pb-32">
          <LoadingSpinner size="lg" className="h-64" />
        </div>
        <MobileNav />
        <CartSidebar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Welcome Message for Logged In Users */}
      {isAuthenticated && user && (
        <section className="py-3 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cream to-almond">
          <div className="max-w-7xl mx-auto text-left">
            <p className="text-sm text-navy font-serif">
              Namaste <span className="text-xl font-bold">{(user as any)?.firstName ? `${(user as any).firstName} ${(user as any)?.lastName || ''}`.trim() : user.username}</span> ji,<br />
              aapka Pathak Bhandar mein swagat hai
            </p>
          </div>
        </section>
      )}
      
      {/* Banner Slideshow */}
      <section className="py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <BannerSlideshow />
        </div>
      </section>

      {/* Category Showcase - Automatic Moving Carousel */}
      <CategoryShowcase />

      {/* Dynamic Fresh Section - Latest products with rotating title */}
      <FreshSection />

      {/* Cart Reminder Section */}
      <CartReminder />

      {/* Featured Products - above Trending section */}
      <CollapsibleSection collapsedHeight={1200} collapsedHeightDesktop={780} label="featured products">
        <section className="pt-2 pb-10 lg:py-12 bg-[#F8F4F1]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6 lg:mb-8">
              <div>
                <h2 className="text-2xl lg:text-4xl font-bold text-navy">Featured Products</h2>
                <p className="text-sm lg:text-base text-gray-500 mt-1">Our most popular and loved items</p>
              </div>
              <Link href="/products">
                <Button variant="ghost" className="hidden md:flex text-champagne font-semibold hover:text-navy">
                  View All Products <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Mobile: 1 card per row (full width, bigger) | Tablet: 2 cols | Desktop: 3 cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {productsLoading ? (
                <LoadingSkeleton type="product" count={6} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6" />
              ) : featuredProducts.length > 0 ? (
                featuredProducts.slice(0, 9).map((product: any) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    isPreviouslyOrdered={Array.isArray(previouslyOrderedProducts) ? previouslyOrderedProducts.includes(product.id) : false}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No products available at the moment.</p>
                  <p className="text-gray-400 text-sm mt-2">Please check back later or contact support.</p>
                </div>
              )}
            </div>

            <div className="text-center mt-8 md:hidden">
              <Link href="/products">
                <Button variant="ghost" className="text-champagne font-semibold">
                  View All Products <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </CollapsibleSection>

      {/* Banner Block: After Featured */}
      <section className="px-4 sm:px-6 lg:px-8 pt-2">
        <div className="max-w-7xl mx-auto">
          <BannerSlideshow placement="after_featured" hideWhenEmpty />
        </div>
      </section>

      {/* Trending in Prayagraj — below Featured Products */}
      <CollapsibleSection collapsedHeight={620} collapsedHeightDesktop={820} label="trending" noFade>
        <TrendingSection />
      </CollapsibleSection>

      {/* Banner Block: After Trending */}
      <section className="px-4 sm:px-6 lg:px-8 pt-2">
        <div className="max-w-7xl mx-auto">
          <BannerSlideshow placement="after_trending" hideWhenEmpty />
        </div>
      </section>

      {/* Mini Banner Slideshow */}
      <div className="pt-2 pb-3 bg-background">
        <div className="max-w-7xl mx-auto">
          <MiniBannerSlideshow />
        </div>
      </div>

      {/* Deal of the Day */}
      <ProductOfDay />

      {/* Banner Block: After Zero Products (after Product of the Day) */}
      <section className="px-4 sm:px-6 lg:px-8 pt-2">
        <div className="max-w-7xl mx-auto">
          <BannerSlideshow placement="after_zero_products" hideWhenEmpty />
        </div>
      </section>

      {/* Chef Editorial Picks */}
      <CollapsibleSection collapsedHeight={500} collapsedHeightDesktop={520} label="chef's picks">
        <ChefEditorial />
      </CollapsibleSection>

      {/* Banner Block: After Chef Editorial */}
      <section className="px-4 sm:px-6 lg:px-8 pt-2">
        <div className="max-w-7xl mx-auto">
          <BannerSlideshow placement="after_chef_editorial" hideWhenEmpty />
        </div>
      </section>

      {/* Customer Testimonials */}
      <CollapsibleSection collapsedHeight={520} collapsedHeightDesktop={620} label="reviews">
        <Testimonials />
      </CollapsibleSection>

      {/* Trust Indicators — slim 4-icon bar */}
      <section className="py-4 bg-[#F5EFE6] border-t border-[#D4B896]/50">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#D4B896]/40">
                <Truck className="h-4.5 w-4.5 text-[#6B3E2E]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p className="font-semibold text-[#3E2723] text-xs leading-tight">Free Delivery</p>
                <p className="text-gray-500 text-[10px] leading-tight">Orders above ₹500</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#D4B896]/40">
                <Smartphone style={{ width: 18, height: 18 }} className="text-[#6B3E2E]" />
              </div>
              <div>
                <p className="font-semibold text-[#3E2723] text-xs leading-tight">Easy Payments</p>
                <p className="text-gray-500 text-[10px] leading-tight">UPI, Cards, COD</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#D4B896]/40">
                <Award style={{ width: 18, height: 18 }} className="text-[#6B3E2E]" />
              </div>
              <div>
                <p className="font-semibold text-[#3E2723] text-xs leading-tight">Quality Guarantee</p>
                <p className="text-gray-500 text-[10px] leading-tight">Fresh, every time</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-[#D4B896]/40">
                <Clock style={{ width: 18, height: 18 }} className="text-[#6B3E2E]" />
              </div>
              <div>
                <p className="font-semibold text-[#3E2723] text-xs leading-tight">Delivered in 30 Min</p>
                <p className="text-gray-500 text-[10px] leading-tight">Within Prayagraj</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Inquiry Banner */}
      <EventInquiryBanner />

      <Footer />
      <MobileNav />
      <CartSidebar />
    </div>
  );
}
