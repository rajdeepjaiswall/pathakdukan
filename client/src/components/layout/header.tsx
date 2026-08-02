import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { ShoppingCart, User, Menu, X, Heart, Settings, LogOut, BarChart3, Package, Download, Search, ChevronDown, ChevronRight, Home, ClipboardList, Phone, Info, Shield, Grid3x3, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useQuery } from '@tanstack/react-query';
import { Category, Product, type HeaderConfig, type FooterConfig } from '@shared/schema';
import { getProductUrl } from '@/lib/product-url';
import pathakLogo from '@assets/project_20250528_0859055-02.png';
import bakeryPattern from '@assets/project_20250607_1604012-01_1749292781428.png';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenuSheetOpen, setIsMenuSheetOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { summary, openCart } = useCart();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');

  // Desktop nav state
  const [isAttention, setIsAttention] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const attentionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attentionInitialRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Live header config (admin-controlled, published version only)
  const { data: siteConfig } = useQuery<{ header: HeaderConfig; footer: FooterConfig }>({
    queryKey: ['/api/site-settings'],
  });
  const headerCfg = siteConfig?.header || {};
  const showSearch = headerCfg.showSearch !== false; // default ON
  const showMenu = headerCfg.showMenu !== false; // default ON
  const logoSrc = headerCfg.logo || pathakLogo;

  const filteredCategories = categories.map(cat => ({
    ...cat,
    productCount: allProducts.filter(p => p.category_id === cat.id).length
  }));

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return allProducts.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [searchTerm, allProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleMenuClose = () => setIsMenuSheetOpen(false);

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
    setLocation('/');
  };

  // Attention animation for unauthenticated users — every 8s, highlight for 2s
  useEffect(() => {
    if (isAuthenticated) {
      setIsAttention(false);
      return;
    }
    const trigger = () => {
      setIsAttention(true);
      setTimeout(() => setIsAttention(false), 2000);
    };
    attentionInitialRef.current = setTimeout(() => {
      trigger();
      attentionIntervalRef.current = setInterval(trigger, 8000);
    }, 4000);
    return () => {
      if (attentionInitialRef.current) clearTimeout(attentionInitialRef.current);
      if (attentionIntervalRef.current) clearInterval(attentionIntervalRef.current);
    };
  }, [isAuthenticated]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = isAuthenticated && user
    ? ((user as any)?.firstName || user?.username || 'Account')
    : null;

  const cartCount = summary?.itemCount ?? 0;

  const navLinkClass = (active = false) =>
    `relative flex items-center gap-1.5 px-1 py-1 text-[14px] font-semibold transition-colors duration-200 group
    ${active ? 'text-[#6B3E2E]' : 'text-[#5a3a28] hover:text-[#6B3E2E]'}`;

  const underline = `after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#8B5E3C] after:transition-all after:duration-300 group-hover:after:w-full`;

  return (
    <header className="bg-cream shadow-lg sticky top-0 z-50 border-b border-almond">
      {/* ── ROW 1: Search | Logo | Menu (all screen sizes) ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-18">
          {/* Left Side: Search */}
          <div className="flex items-center justify-start">
            {showSearch && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-navy hover:bg-almond/30">
                  <Search className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-cream p-0 overflow-hidden">
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `url(${bakeryPattern})`,
                    backgroundSize: '200px 200px',
                    backgroundRepeat: 'repeat'
                  }}
                />
                <div className="relative h-full flex flex-col p-6">
                  <SheetHeader className="mb-6">
                    <SheetTitle className="text-navy font-bold text-xl text-center">Search Products</SheetTitle>
                  </SheetHeader>

                  <form onSubmit={handleSearch} className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/50" />
                    <Input
                      autoFocus
                      placeholder="What are you looking for?"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 border-almond focus:border-champagne rounded-full"
                    />
                  </form>

                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {searchTerm.trim() ? (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-navy/60 uppercase tracking-wider px-2">Search Results</h4>
                        {searchResults.length > 0 ? (
                          <div className="space-y-2">
                            {searchResults.map((product) => (
                              <Link
                                key={product.id}
                                href={getProductUrl(product)}
                                className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/30 transition-colors group bg-white/40 border border-almond/20"
                              >
                                {product.images && product.images.length > 0 && (
                                  <img src={product.images[0]} alt={product.name} className="h-10 w-10 object-cover rounded-lg" />
                                )}
                                <div className="flex flex-col">
                                  <span className="text-navy font-medium group-hover:text-amber-900 line-clamp-1">{product.name}</span>
                                  <span className="text-xs text-navy/60">₹{Number(product.price).toFixed(2)}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-navy/60 py-10">No products found for "{searchTerm}"</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-navy/60 uppercase tracking-wider px-2 mb-2">Categories</h4>
                        <Accordion type="single" collapsible className="w-full space-y-2">
                          {filteredCategories.map((category) => (
                            <AccordionItem key={category.id} value={`cat-${category.id}`} className="border-none">
                              <AccordionTrigger className="flex items-center justify-between p-3 rounded-xl hover:bg-almond/30 transition-colors group hover:no-underline py-3">
                                <div className="flex items-center space-x-2">
                                  <span className="text-navy font-medium group-hover:text-amber-900">{category.name}</span>
                                  <span className="bg-champagne/30 text-navy text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {category.productCount}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-1 pb-2 px-2">
                                <div className="grid grid-cols-1 gap-1">
                                  {allProducts
                                    .filter(p => p.category_id === category.id)
                                    .map(product => (
                                      <Link
                                        key={product.id}
                                        href={getProductUrl(product)}
                                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-champagne/20 transition-colors group"
                                      >
                                        <div className="h-8 w-8 rounded bg-white flex items-center justify-center overflow-hidden border border-almond/20">
                                          {product.images && product.images.length > 0 ? (
                                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                          ) : (
                                            <Package className="h-4 w-4 text-navy/20" />
                                          )}
                                        </div>
                                        <span className="text-sm text-navy/80 group-hover:text-navy truncate font-medium">
                                          {product.name}
                                        </span>
                                      </Link>
                                    ))
                                  }
                                  <Link
                                    href={`/products?category=${category.id}`}
                                    className="text-center text-xs text-amber-800 font-bold py-2 mt-1 hover:underline"
                                  >
                                    View All {category.name}
                                  </Link>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            )}
          </div>

          {/* Center: Logo */}
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <img
                src={logoSrc}
                alt="Pathak Bhandar Logo"
                className="h-10 sm:h-14 object-contain"
              />
            </Link>
          </div>

          {/* Right Side: Hamburger Menu */}
          <div className="flex items-center justify-end">
            {showMenu && (
            <Sheet open={isMenuSheetOpen} onOpenChange={setIsMenuSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-navy hover:bg-almond/30">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 bg-cream p-0 overflow-hidden flex flex-col">
                <div
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `url(${bakeryPattern})`,
                    backgroundSize: '200px 200px',
                    backgroundRepeat: 'repeat'
                  }}
                />
                <div className="relative h-full flex flex-col">
                  {/* Header */}
                  <div className="p-6 pb-4 border-b border-almond/50">
                    <SheetTitle className="text-navy font-bold text-xl mb-4">Menu</SheetTitle>
                    {isAuthenticated && user ? (
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 border-2 border-champagne">
                          <AvatarImage src={(user as any)?.profileImageUrl} />
                          <AvatarFallback className="bg-champagne text-navy font-bold text-lg">
                            {((user as any)?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-navy/60 text-xs">Namaste</p>
                          <p className="text-navy font-bold text-sm truncate max-w-[160px]">
                            {(user as any)?.firstName
                              ? `${(user as any).firstName} ${(user as any)?.lastName || ''}`.trim()
                              : user?.username}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Link href="/login" onClick={handleMenuClose}>
                          <Button className="w-full bg-navy text-cream hover:bg-navy/90 font-bold rounded-xl">
                            Login to Account
                          </Button>
                        </Link>
                        <Link href="/customer/register" onClick={handleMenuClose}>
                          <Button variant="outline" className="w-full border-navy text-navy hover:bg-navy/5 font-bold rounded-xl">
                            Create New Account
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Navigation Items */}
                  <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    <Link href="/" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Home className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-navy font-semibold">Home</span>
                      </div>
                    </Link>

                    <Link href="/customer/wishlist" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                          <Heart className="h-5 w-5 text-red-500" />
                        </div>
                        <span className="text-navy font-semibold">Favorites</span>
                      </div>
                    </Link>

                    <Link href="/customer/orders" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                          <ClipboardList className="h-5 w-5 text-orange-600" />
                        </div>
                        <span className="text-navy font-semibold">Orders</span>
                      </div>
                    </Link>

                    <Link href="/contact-us" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-navy font-semibold">Contact Us</span>
                      </div>
                    </Link>

                    <Link href="/about-us" onClick={handleMenuClose}>
                      <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Info className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="text-navy font-semibold">About Us</span>
                      </div>
                    </Link>

                    {isAuthenticated && (
                      <Link href="/customer/account" onClick={handleMenuClose}>
                        <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-almond/40 transition-colors group cursor-pointer">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Settings className="h-5 w-5 text-gray-600" />
                          </div>
                          <span className="text-navy font-semibold">Account Settings</span>
                        </div>
                      </Link>
                    )}

                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                      <Link href="/admin" onClick={handleMenuClose}>
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-navy/5 hover:bg-navy/10 transition-colors group cursor-pointer border border-navy/10">
                          <div className="w-9 h-9 rounded-lg bg-navy flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="h-5 w-5 text-champagne" />
                          </div>
                          <span className="text-navy font-bold">Admin Dashboard</span>
                        </div>
                      </Link>
                    )}

                    {isAuthenticated && (
                      <div className="pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition-colors group cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <LogOut className="h-5 w-5 text-red-500" />
                          </div>
                          <span className="text-red-600 font-semibold">Logout</span>
                        </button>
                      </div>
                    )}
                  </nav>

                  {/* Admin Login Button at Bottom */}
                  <div className="p-4 border-t border-almond/50">
                    {!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin') ? (
                      <Link href="/admin/login" onClick={handleMenuClose}>
                        <button className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-navy text-cream hover:bg-navy/90 transition-colors font-bold">
                          <Shield className="h-4 w-4" />
                          <span>Admin Login</span>
                        </button>
                      </Link>
                    ) : (
                      <Link href="/admin" onClick={handleMenuClose}>
                        <button className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl bg-champagne text-navy hover:bg-champagne/90 transition-colors font-bold">
                          <Shield className="h-4 w-4" />
                          <span>Go to Admin Panel</span>
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 2: Secondary Navigation Bar (tablet+desktop) ── */}
      <div
        className="hidden md:block border-t transition-colors duration-700 ease-in-out"
        style={{
          borderColor: 'rgba(107,62,46,0.12)',
          backgroundColor: isAttention ? '#FFE5E5' : '#F8F4F1',
        }}
      >
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center justify-center gap-8 py-3">

            {/* Home */}
            <Link href="/">
              <span className={`${navLinkClass(location === '/')} ${underline}`}>
                <Home className="h-4 w-4 flex-shrink-0" />
                Home
              </span>
            </Link>

            {/* Orders */}
            <Link href="/customer/orders">
              <span className={`${navLinkClass(location === '/customer/orders')} ${underline}`}>
                <ClipboardList className="h-4 w-4 flex-shrink-0" />
                Orders
              </span>
            </Link>

            {/* Category — hover dropdown */}
            <div className="relative" ref={categoryRef}>
              <button
                onMouseEnter={() => setIsCategoryOpen(true)}
                onMouseLeave={() => setIsCategoryOpen(false)}
                onClick={() => setIsCategoryOpen(v => !v)}
                className={`${navLinkClass()} ${underline} cursor-pointer bg-transparent border-none outline-none`}
              >
                <Grid3x3 className="h-4 w-4 flex-shrink-0" />
                Category
                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Category Dropdown */}
              {isCategoryOpen && (
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-2xl shadow-2xl border border-[rgba(107,62,46,0.1)] z-50 py-3 min-w-[200px]"
                  onMouseEnter={() => setIsCategoryOpen(true)}
                  onMouseLeave={() => setIsCategoryOpen(false)}
                >
                  <div className="px-3 pb-2 mb-1 border-b border-[rgba(107,62,46,0.08)]">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#8B5E3C]/60">Browse By Category</p>
                  </div>
                  {categories.slice(0, 10).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.id}`}
                      onClick={() => setIsCategoryOpen(false)}
                    >
                      <div className="flex items-center justify-between px-4 py-2.5 hover:bg-[#F8F4F1] transition-colors group cursor-pointer">
                        <span className="text-[13px] font-medium text-[#5a3a28] group-hover:text-[#6B3E2E]">{cat.name}</span>
                        <ChevronRight className="h-3 w-3 text-[#8B5E3C]/40 group-hover:text-[#6B3E2E]" />
                      </div>
                    </Link>
                  ))}
                  <div className="px-3 pt-2 mt-1 border-t border-[rgba(107,62,46,0.08)]">
                    <Link href="/products" onClick={() => setIsCategoryOpen(false)}>
                      <p className="text-[12px] font-bold text-[#8B5E3C] text-center py-1 hover:underline cursor-pointer">
                        View All Products
                      </p>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={openCart}
              className={`${navLinkClass()} cursor-pointer bg-transparent border-none outline-none relative`}
            >
              <ShoppingCart className="h-4 w-4 flex-shrink-0" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-3 bg-[#6B3E2E] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center min-w-[18px] px-1 leading-none">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-[rgba(107,62,46,0.2)]" />

            {/* Sign In / Account */}
            {isAuthenticated && user ? (
              <div className="relative" ref={accountRef}>
                <button
                  onMouseEnter={() => setIsAccountOpen(true)}
                  onMouseLeave={() => setIsAccountOpen(false)}
                  onClick={() => setIsAccountOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6B3E2E]/8 hover:bg-[#6B3E2E]/15 transition-colors duration-200 cursor-pointer border-none outline-none"
                >
                  <div className="w-6 h-6 rounded-full bg-[#6B3E2E] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[11px] font-black">
                      {((user as any)?.firstName || user?.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[14px] font-semibold text-[#5a3a28] max-w-[100px] truncate">
                    Hi, {displayName?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-[#8B5E3C] transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown */}
                {isAccountOpen && (
                  <div
                    className="absolute top-full right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-[rgba(107,62,46,0.1)] z-50 py-3 min-w-[180px]"
                    onMouseEnter={() => setIsAccountOpen(true)}
                    onMouseLeave={() => setIsAccountOpen(false)}
                  >
                    <div className="px-4 pb-2 mb-1 border-b border-[rgba(107,62,46,0.08)]">
                      <p className="text-[12px] font-bold text-[#6B3E2E]">{displayName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user?.email || user?.username}</p>
                    </div>
                    <Link href="/customer/account" onClick={() => setIsAccountOpen(false)}>
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F4F1] transition-colors cursor-pointer group">
                        <Settings className="h-4 w-4 text-[#8B5E3C]" />
                        <span className="text-[13px] font-medium text-[#5a3a28] group-hover:text-[#6B3E2E]">My Account</span>
                      </div>
                    </Link>
                    <Link href="/customer/orders" onClick={() => setIsAccountOpen(false)}>
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8F4F1] transition-colors cursor-pointer group">
                        <ClipboardList className="h-4 w-4 text-[#8B5E3C]" />
                        <span className="text-[13px] font-medium text-[#5a3a28] group-hover:text-[#6B3E2E]">My Orders</span>
                      </div>
                    </Link>
                    <div className="px-3 pt-2 mt-1 border-t border-[rgba(107,62,46,0.08)]">
                      <button
                        onClick={() => { handleLogout(); setIsAccountOpen(false); }}
                        className="w-full flex items-center gap-3 px-1 py-2 hover:bg-red-50 transition-colors cursor-pointer rounded-xl group"
                      >
                        <LogOut className="h-4 w-4 text-red-400" />
                        <span className="text-[13px] font-medium text-red-500 group-hover:text-red-600">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <span
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-[14px] transition-all duration-300 cursor-pointer border"
                  style={{
                    backgroundColor: isAttention ? '#FF4D4D' : '#6B3E2E',
                    borderColor: isAttention ? '#FF4D4D' : '#6B3E2E',
                    color: '#fff',
                    transform: isAttention ? 'scale(1.04)' : 'scale(1)',
                    boxShadow: isAttention ? '0 0 12px rgba(255,77,77,0.4)' : '0 2px 8px rgba(107,62,46,0.25)',
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
              </Link>
            )}

          </div>
        </div>
      </div>

      {/* ── Animation keyframes (desktop only) ── */}
      <style>{`
        @media (min-width: 1025px) {
          .desk-nav-attention {
            animation: navPulse 2s ease-in-out;
          }
          @keyframes navPulse {
            0% { background-color: #F8F4F1; }
            30% { background-color: #FFE5E5; }
            70% { background-color: #FFE5E5; }
            100% { background-color: #F8F4F1; }
          }
        }
      `}</style>
    </header>
  );
}
