import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';
import ProductCard from '@/components/product/product-card';

export default function Products() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products', { search: searchTerm, category_id: selectedCategory !== 'all' ? selectedCategory : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category_id', selectedCategory);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      return response.json();
    },
  });

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Page Header */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">Our Products</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover our premium collection of traditional biscuits, cookies, and confectionery items
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="bg-champagne text-navy hover:bg-champagne/90"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="bg-champagne text-navy hover:bg-champagne/90"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-2xl" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">No products found</p>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`grid gap-4 lg:gap-5 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-1'
            }`}>
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Load More */}
          {products.length > 0 && (
            <div className="text-center mt-12">
              <Button 
                variant="outline" 
                className="text-champagne border-champagne hover:bg-champagne hover:text-navy"
              >
                Load More Products
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <MobileNav />
      <CartSidebar />
    </div>
  );
}
