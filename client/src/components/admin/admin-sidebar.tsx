import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  Settings, 
  Image,
  Grid3X3,
  LogOut,
  ArrowLeft,
  Home,
  CreditCard,
  Wallet,
  CheckCircle,
  MessageSquare,
  FileText,
  Truck,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { cn } from '@/lib/utils';
import type { AdminFeatureKey } from '@shared/schema';

interface NavItem {
  title: string;
  href: string;
  icon: any;
  feature?: AdminFeatureKey; // when omitted, always visible to admins
}

const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard, feature: 'dashboard' },
  { title: 'Products', href: '/admin/products', icon: Package, feature: 'products' },
  { title: 'Categories', href: '/admin/categories', icon: Grid3X3, feature: 'categories' },
  { title: 'Banners', href: '/admin/banners', icon: Image, feature: 'banners' },
  { title: 'Orders', href: '/admin/orders', icon: ShoppingBag, feature: 'orders' },
  { title: 'Verified Customers', href: '/admin/verified-customers', icon: CheckCircle, feature: 'verified_customers' },
  { title: 'All Customers', href: '/admin/customers', icon: Users, feature: 'customers' },
  { title: 'Payments', href: '/admin/payments', icon: CreditCard, feature: 'payments' },
  { title: 'Payment Gateway', href: '/admin/payment-gateway', icon: Wallet, feature: 'payment_gateway' },
  { title: 'Charges', href: '/admin/charges', icon: Truck, feature: 'charges' },
  { title: 'Analytics', href: '/admin/analytics', icon: BarChart3, feature: 'reports' },
  { title: 'Testimonials', href: '/admin/testimonials', icon: MessageSquare, feature: 'testimonials' },
  { title: 'Legal Pages', href: '/admin/legal-pages', icon: FileText, feature: 'legal_pages' },
];

const superAdminNavItems: NavItem[] = [
  { title: 'Admin Management', href: '/super-admin/admins', icon: Shield },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { can, isSuperAdmin } = useAdminPermissions();
  const visibleAdminNavItems = adminNavItems.filter((item) => !item.feature || isSuperAdmin || can(item.feature));

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:bg-white lg:border-r lg:border-gray-200">
      <div className="flex flex-col flex-grow overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-champagne rounded-lg flex items-center justify-center">
              <span className="text-navy font-bold text-sm">PB</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-navy">Pathak Bhandar</h2>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center">
              <span className="text-champagne font-medium text-sm">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-navy">{user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {visibleAdminNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-10 px-3 text-sm font-medium",
                    isActive
                      ? "bg-champagne/10 text-navy border border-champagne/20"
                      : "text-gray-700 hover:bg-gray-50 hover:text-navy"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
          
          {/* Super Admin Section */}
          {user?.role === 'super_admin' && (
            <>
              <div className="my-4 border-t border-gray-200"></div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Super Admin
              </div>
              {superAdminNavItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-10 px-3 text-sm font-medium",
                        isActive
                          ? "bg-orange-50/50 text-navy border border-orange-200"
                          : "text-gray-700 hover:bg-orange-50/30 hover:text-navy"
                      )}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="px-4 py-4 border-t border-gray-200 space-y-2">
          <Link href="/">
            <Button
              variant="ghost"
              className="w-full justify-start h-10 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-navy"
            >
              <Home className="h-4 w-4 mr-3" />
              Back to Store
            </Button>
          </Link>
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start h-10 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}