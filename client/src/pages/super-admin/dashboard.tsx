import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  Users, 
  Package, 
  ShoppingCart, 
  Settings,
  Database,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  Bell,
  BarChart3,
  UserCog,
  Sparkles,
  Inbox,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { formatPrice } from '@/lib/cart';
import { useLocation } from 'wouter';

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not super admin
  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery<{
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    ordersReceivedToday: number;
    ordersDeliveredToday: number;
    ordersCancelledToday: number;
    recentOrders: any[];
    topProducts: any[];
  }>({
    queryKey: ['/api/admin/analytics'],
  });

  // Fetch system stats (this would be extended in a real app)
  const systemStats = {
    uptime: '99.9%',
    responseTime: '120ms',
    totalUsers: analytics?.totalCustomers || 0,
    activeOrders: 0,
    systemHealth: 'Healthy',
    lastBackup: '2 hours ago',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-champagne" />
            <h1 className="text-3xl font-bold text-navy">Super Admin Dashboard</h1>
          </div>
          <p className="text-gray-600">
            Complete system overview and advanced administration tools for {user?.username}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={() => setLocation('/super-admin/admins')}
            data-testid="button-admin-management"
          >
            <UserCog className="h-6 w-6" />
            <span>Admin Management</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-green-300 text-green-700 hover:bg-green-50"
            onClick={() => setLocation('/super-admin/pages')}
            data-testid="button-page-editor"
          >
            <FileText className="h-6 w-6" />
            <span>Page Editor</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            onClick={() => setLocation('/admin/banners')}
            data-testid="button-popup-banners"
          >
            <Bell className="h-6 w-6" />
            <span>Popup Banners</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-rose-300 text-rose-700 hover:bg-rose-50"
            onClick={() => setLocation('/admin/dashboard')}
          >
            <Activity className="h-6 w-6" />
            <span>Admin Dashboard</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
            onClick={() => setLocation('/super-admin/logo-manager')}
          >
            <Settings className="h-6 w-6" />
            <span>Logo Manager</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col gap-2 border-teal-300 text-teal-700 hover:bg-teal-50"
            onClick={() => setLocation('/super-admin/shopkeepers')}
          >
            <Users className="h-6 w-6" />
            <span>Manage Shopkeepers</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-8">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={() => setLocation('/super-admin/foundation-settings')}
            data-testid="button-foundation-settings"
          >
            <Sparkles className="h-6 w-6" />
            <span>Foundation Page</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            onClick={() => setLocation('/super-admin/foundation-enquiries')}
            data-testid="button-foundation-enquiries"
          >
            <Inbox className="h-6 w-6" />
            <span>Foundation Enquiries</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => setLocation('/super-admin/deleted-accounts')}
            data-testid="button-deleted-accounts"
          >
            <Trash2 className="h-6 w-6" />
            <span>Deleted Accounts</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            onClick={() => setLocation('/super-admin/backup-status')}
            data-testid="button-backup-status"
          >
            <Database className="h-6 w-6" />
            <span>Backup Database</span>
          </Button>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{formatPrice(analytics?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{analytics?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground">Completed orders</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{analytics?.totalCustomers || 0}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-navy">{analytics?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">Products in catalog</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
