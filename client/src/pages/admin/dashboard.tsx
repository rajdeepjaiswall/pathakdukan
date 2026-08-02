import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Radio,
  Calendar,
  Truck,
  XCircle,
  Volume2,
  Bell,
  IndianRupee,
  QrCode,
  Upload,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  Store,
  FileText,
  UserCog,
  AtSign,
  PanelTop,
  PanelBottom,
  ChevronDown,
  ChevronUp,
  Construction,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/cart';
import { ORDER_STATUSES } from '@/lib/constants';
import { apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import type { ManualPaymentConfig } from '@shared/schema';

// Generate 30-minute interval time options in 12h format
const TIME_OPTIONS: { label: string; value: string }[] = (() => {
  const opts: { label: string; value: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const period = h < 12 ? 'AM' : 'PM';
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      opts.push({
        label: `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`,
        value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      });
    }
  }
  return opts;
})();

const DEFAULT_SCHEDULE = [
  { day: 'monday',    openTime: '09:00', closeTime: '22:00', enabled: true  },
  { day: 'tuesday',   openTime: '09:00', closeTime: '22:00', enabled: true  },
  { day: 'wednesday', openTime: '09:00', closeTime: '22:00', enabled: true  },
  { day: 'thursday',  openTime: '09:00', closeTime: '22:00', enabled: true  },
  { day: 'friday',    openTime: '09:00', closeTime: '23:00', enabled: true  },
  { day: 'saturday',  openTime: '10:00', closeTime: '23:00', enabled: true  },
  { day: 'sunday',    openTime: '10:00', closeTime: '21:00', enabled: false },
];

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not admin after auth is confirmed
  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      setLocation('/admin/login');
    }
  }, [user, authLoading, setLocation]);

  // Shop Timing state
  const [shopTimingOpen, setShopTimingOpen] = useState(false);
  const [shopIsOpen, setShopIsOpen] = useState(true);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  // Maintenance mode state
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Fetch maintenance status
  const { data: maintenanceStatus } = useQuery<{ enabled: boolean }>({
    queryKey: ['/api/maintenance-status'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  useEffect(() => {
    if (maintenanceStatus) {
      setMaintenanceMode(maintenanceStatus.enabled);
    }
  }, [maintenanceStatus]);

  const maintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest('PATCH', '/api/admin/maintenance-status', { enabled });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance-status'] });
      toast({
        title: maintenanceMode ? 'Maintenance Mode ON' : 'Maintenance Mode OFF',
        description: maintenanceMode
          ? 'The website is now hidden from customers. Only admins can access it.'
          : 'The website is now visible to all customers.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update maintenance mode', variant: 'destructive' });
    },
  });

  const handleToggleMaintenance = () => {
    const newVal = !maintenanceMode;
    setMaintenanceMode(newVal);
    maintenanceMutation.mutate(newVal);
  };

  // Fetch shop settings
  const { data: shopSettings } = useQuery<any>({
    queryKey: ['/api/admin/shop-settings'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Sync shop settings into local state
  useEffect(() => {
    if (shopSettings) {
      setShopIsOpen(Boolean(shopSettings.is_open));
      if (Array.isArray(shopSettings.schedule) && shopSettings.schedule.length > 0) {
        setSchedule(shopSettings.schedule);
      }
    }
  }, [shopSettings]);

  const saveShopSettingsMutation = useMutation({
    mutationFn: async (data: { isOpen?: boolean; manualOverride?: boolean; schedule?: typeof DEFAULT_SCHEDULE }) => {
      const response = await apiRequest('PATCH', '/api/admin/shop-settings', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/shop-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop-status'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to save shop settings', variant: 'destructive' });
    },
  });

  const handleToggleShopOpen = () => {
    const newVal = !shopIsOpen;
    setShopIsOpen(newVal);
    saveShopSettingsMutation.mutate({ isOpen: newVal, manualOverride: true });
  };

  const handleSaveSchedule = () => {
    saveShopSettingsMutation.mutate({ schedule, manualOverride: false });
    toast({ title: 'Schedule Saved', description: 'Shop timing schedule updated successfully' });
  };

  const updateDaySchedule = (idx: number, field: string, value: any) => {
    setSchedule(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  // Live visitor counter state
  const [liveVisitors, setLiveVisitors] = useState(Math.floor(Math.random() * 5) + 1);
  const [isOnline, setIsOnline] = useState(true);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    // Create audio element for order notifications
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
    
    // Generate notification sound programmatically
    const generateNotificationSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.6);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.9);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 1);
    };

    const playNotification = () => {
      try {
        generateNotificationSound();
      } catch (error) {
        console.warn('Audio notification failed:', error);
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener('canplay', playNotification);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplay', playNotification);
      }
    };
  }, []);

  // Simulate live order updates (in production, this would be WebSocket)
  useEffect(() => {
    const checkForNewOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('/api/admin/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const orders = await response.json();
          const recentOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];
          
          if (liveOrders.length > 0 && recentOrders.length > liveOrders.length) {
            // New order detected
            setNewOrderAlert(true);
            
            // Play notification sound for 5 seconds
            const playSound = () => {
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Create ringing sound pattern
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                
                let currentTime = audioContext.currentTime;
                for (let i = 0; i < 10; i++) { // 10 rings over 5 seconds
                  oscillator.frequency.setValueAtTime(800, currentTime);
                  oscillator.frequency.setValueAtTime(600, currentTime + 0.2);
                  oscillator.frequency.setValueAtTime(800, currentTime + 0.4);
                  currentTime += 0.5;
                }
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 5);
                
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 5);
              } catch (error) {
                console.warn('Audio notification failed:', error);
              }
            };
            
            playSound();
            
            setTimeout(() => setNewOrderAlert(false), 5000);
          }
          
          setLiveOrders(recentOrders);
        }
      } catch (error) {
        console.warn('Failed to check for new orders:', error);
      }
    };

    // Check every 10 seconds
    const interval = setInterval(checkForNewOrders, 10000);
    checkForNewOrders(); // Initial check

    return () => clearInterval(interval);
  }, [liveOrders.length]);

  // Update live visitors periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveVisitors(prev => {
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        return Math.max(0, Math.min(15, prev + change)); // Keep between 0-15
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery<{
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
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Fetch recent orders
  const { data: recentOrders = [], isLoading: ordersLoading, refetch: refetchOrders } = useQuery<any[]>({
    queryKey: ['/api/admin/orders'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
    refetchInterval: 30000, // Refetch every 30 seconds
  });


  // Payment config state and queries
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrEnabled, setQrEnabled] = useState(false);

  // Fetch manual payment config
  const { data: paymentConfig } = useQuery<ManualPaymentConfig | null>({
    queryKey: ['/api/admin/manual-payment-config'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Fetch QR payment orders (users who selected QR payment)
  const { data: qrPaymentOrders = [] } = useQuery<any[]>({
    queryKey: ['/api/admin/orders', { paymentMethod: 'qr' }],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders?paymentMethod=qr', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  // Update local state when config loads
  useEffect(() => {
    if (paymentConfig) {
      setQrImageUrl(paymentConfig.qrImageUrl || '');
      setUpiId(paymentConfig.upiId || '');
      setQrEnabled(paymentConfig.isActive || false);
    }
  }, [paymentConfig]);

  // Save payment config mutation
  const savePaymentConfigMutation = useMutation({
    mutationFn: async (data: { qrImageUrl: string; upiId: string; isActive: boolean }) => {
      const response = await apiRequest('POST', '/api/admin/manual-payment-config', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/manual-payment-config'] });
      toast({
        title: 'Payment Settings Saved',
        description: 'QR/UPI payment configuration updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payment settings',
        variant: 'destructive',
      });
    },
  });

  const handleSavePaymentConfig = () => {
    savePaymentConfigMutation.mutate({
      qrImageUrl,
      upiId,
      isActive: qrEnabled,
    });
  };

  const getStatusColor = (status: string, paymentMethod?: string, paymentStatus?: string) => {
    // Gateway payments show as successful only if payment is explicitly completed (paid/success/completed)
    const isGatewayPaid = paymentMethod === 'gateway' && (paymentStatus === 'paid' || paymentStatus === 'success' || paymentStatus === 'completed');
    if (isGatewayPaid && status !== 'cancelled' && status !== 'payment_failed') {
      return 'bg-green-100 text-green-800';
    }
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      case 'payment_success': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'payment_failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string, paymentMethod?: string, paymentStatus?: string) => {
    // Gateway payments show checkmark only if payment is explicitly completed (paid/success/completed)
    const isGatewayPaid = paymentMethod === 'gateway' && (paymentStatus === 'paid' || paymentStatus === 'success' || paymentStatus === 'completed');
    if (isGatewayPaid && status !== 'cancelled' && status !== 'payment_failed') {
      return <CheckCircle className="h-3 w-3" />;
    }
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'pending_payment': return <Clock className="h-3 w-3" />;
      case 'payment_success': return <CheckCircle className="h-3 w-3" />;
      case 'confirmed': return <CheckCircle className="h-3 w-3" />;
      case 'processing': return <Package className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      case 'payment_failed': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: string, paymentMethod?: string, paymentStatus?: string) => {
    // Gateway payments show as successful only if payment is explicitly completed (paid/success/completed)
    const isGatewayPaid = paymentMethod === 'gateway' && (paymentStatus === 'paid' || paymentStatus === 'success' || paymentStatus === 'completed');
    if (isGatewayPaid && status !== 'cancelled' && status !== 'payment_failed') {
      return 'Payment Successful';
    }
    switch (status) {
      case 'pending_payment': return 'Payment Pending';
      case 'payment_success': return 'Payment Successful';
      case 'confirmed': return 'Delivery Pending';
      default: return status.replace(/_/g, ' ');
    }
  };

  const getBorderColor = (status: string, paymentMethod?: string, paymentStatus?: string) => {
    // Gateway payments show green border only if payment is explicitly completed (paid/success/completed)
    const isGatewayPaid = paymentMethod === 'gateway' && (paymentStatus === 'paid' || paymentStatus === 'success' || paymentStatus === 'completed');
    if (isGatewayPaid && status !== 'cancelled' && status !== 'payment_failed') {
      return 'border-green-500 border-2';
    }
    switch (status) {
      case 'payment_success':
      case 'confirmed':
      case 'delivered':
        return 'border-green-500 border-2';
      case 'pending':
      case 'pending_payment':
        return 'border-yellow-400 border-2';
      case 'cancelled':
      case 'payment_failed':
        return 'border-red-500 border-2';
      default:
        return 'border-gray-200';
    }
  };

  if (authLoading || analyticsLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <AdminSidebar />
        <div className="lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading spinner while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#6B3E2E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#6B3E2E] text-sm font-medium">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  // Prevent rendering if not authorized (useEffect will redirect)
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar />
      
      <div className="lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user?.username}! Here's what's happening with your bakery.</p>
          </div>

          {/* Shop Status & Timing */}
          <div className="mb-8">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                {/* Top Row: Status toggle + Timing expand button */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Shop Status Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Shop Status</span>
                    <button
                      onClick={handleToggleShopOpen}
                      disabled={saveShopSettingsMutation.isPending}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                        shopIsOpen
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                    >
                      Shop is {shopIsOpen ? 'Open' : 'Closed'}
                      <span className={`inline-block w-5 h-5 rounded-full shadow-sm transition-all ${shopIsOpen ? 'bg-white' : 'bg-gray-400'}`} />
                    </button>
                  </div>

                  {/* Maintenance Mode Toggle */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Maintenance</span>
                    <button
                      onClick={handleToggleMaintenance}
                      disabled={maintenanceMutation.isPending}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                        maintenanceMode
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-gray-100 border-gray-300 text-gray-600'
                      }`}
                    >
                      <Construction className="h-4 w-4" />
                      {maintenanceMode ? 'ON' : 'OFF'}
                      <span className={`inline-block w-5 h-5 rounded-full shadow-sm transition-all ${maintenanceMode ? 'bg-white' : 'bg-gray-400'}`} />
                    </button>
                  </div>

                  {/* Shop Timing Expand Button */}
                  <button
                    onClick={() => setShopTimingOpen(!shopTimingOpen)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Shop Timing
                    {shopTimingOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Expanded Schedule Section */}
                {shopTimingOpen && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-navy">Weekly Shop Timing</span>
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </div>
                      <button onClick={() => setShopTimingOpen(false)}>
                        <ChevronUp className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    </div>

                    {/* Schedule Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr>
                            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Day</th>
                            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Open Time</th>
                            <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wide">Close Time</th>
                            <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {schedule.map((day, idx) => (
                            <tr key={day.day} className="border-t border-gray-100">
                              <td className="py-3 pr-4 font-medium text-navy capitalize">{day.day}</td>
                              <td className="py-3 pr-4">
                                <Select
                                  value={day.openTime}
                                  onValueChange={(v) => updateDaySchedule(idx, 'openTime', v)}
                                >
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-48">
                                    {TIME_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3 pr-4">
                                <Select
                                  value={day.closeTime}
                                  onValueChange={(v) => updateDaySchedule(idx, 'closeTime', v)}
                                >
                                  <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-48">
                                    {TIME_OPTIONS.map(opt => (
                                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3">
                                <Switch
                                  checked={day.enabled}
                                  onCheckedChange={(v) => updateDaySchedule(idx, 'enabled', v)}
                                  className="data-[state=checked]:bg-green-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button
                        onClick={handleSaveSchedule}
                        disabled={saveShopSettingsMutation.isPending}
                        className="bg-[#3d5a1e] hover:bg-[#2e4316] text-white text-sm px-5"
                      >
                        {saveShopSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions — filtered by per-admin permissions */}
          <DashboardTiles />

          {/* Analytics Cards - 4x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Row 1 */}
            {/* Live Visitors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Live Visitors</CardTitle>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <Radio className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{liveVisitors}</div>
                <p className={`text-xs flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                  LIVE
                </p>
              </CardContent>
            </Card>

            {/* Orders Received Today */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Received Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.ordersReceivedToday || 0}</div>
                <p className="text-xs text-muted-foreground">Today's new orders</p>
              </CardContent>
            </Card>

            {/* Orders Delivered Today */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Delivered Today</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.ordersDeliveredToday || 0}</div>
                <p className="text-xs text-muted-foreground">Successfully delivered</p>
              </CardContent>
            </Card>

            {/* Orders Cancelled Today */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Cancelled Today</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.ordersCancelledToday || 0}</div>
                <p className="text-xs text-muted-foreground">Cancelled orders</p>
              </CardContent>
            </Card>

            {/* Row 2 */}
            {/* Total Orders */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">All time orders</p>
              </CardContent>
            </Card>

            {/* Total Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{formatPrice(analytics?.totalRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">All time revenue</p>
              </CardContent>
            </Card>

            {/* Total Products */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">Active products</p>
              </CardContent>
            </Card>

            {/* Total Customers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-navy">{analytics?.totalCustomers || 0}</div>
                <p className="text-xs text-muted-foreground">Registered customers</p>
              </CardContent>
            </Card>
          </div>

          {/* Live Orders Section */}
          {liveOrders.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-semibold text-navy">Live Orders</h3>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  newOrderAlert ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-green-100 text-green-800'
                }`}>
                  {newOrderAlert ? (
                    <>
                      <Bell className="h-3 w-3" />
                      NEW ORDER!
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Up to date
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveOrders.map((order: any) => (
                  <Card key={order.id} className={getBorderColor(order.status, order.paymentMethod, order.paymentStatus)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-navy">Order #{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                        </div>
                        <Badge className={getStatusColor(order.status, order.paymentMethod, order.paymentStatus)}>
                          {getStatusLabel(order.status, order.paymentMethod, order.paymentStatus)}
                        </Badge>
                      </div>
                      <div className="space-y-1 mb-3 text-sm">
                        <p className="text-gray-700 font-medium">{order.customerName}</p>
                        <p className="text-gray-600 line-clamp-1">{order.items?.map((i: any) => i.name).join(', ')}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <p className="font-bold text-navy">{formatPrice(parseFloat(order.total))}</p>
                        <Link href={`/admin/orders`}>
                          <Button variant="ghost" size="sm" className="text-champagne h-7 px-2">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders and Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="text-champagne">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.recentOrders?.length ? (
                    analytics.recentOrders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-white transition-colors shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-champagne/10 rounded-full flex items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-champagne" />
                          </div>
                          <div>
                            <p className="font-semibold text-navy">#{order.orderNumber}</p>
                            <p className="text-xs text-gray-500">{order.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-navy">{formatPrice(parseFloat(order.total))}</p>
                          <Badge className={getStatusColor(order.status, order.paymentMethod, order.paymentStatus)}>
                            {getStatusLabel(order.status, order.paymentMethod, order.paymentStatus)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No recent orders</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top Products</CardTitle>
                <Link href="/admin/products">
                  <Button variant="ghost" size="sm" className="text-champagne">Manage</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.topProducts?.length ? (
                    analytics.topProducts.slice(0, 5).map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-white transition-colors shadow-sm">
                        <div className="flex items-center gap-4">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-navy">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-navy">{product.salesCount || 0} sales</p>
                          <p className="text-xs text-green-600 font-medium">{formatPrice(product.revenue || 0)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No top products data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== Permission-aware tile grid ==============
type DashboardTile = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  feature: string;
  testId: string;
};

const DASHBOARD_TILES: DashboardTile[] = [
  { href: '/admin/orders',            label: 'Orders',          icon: ShoppingCart, feature: 'orders',           testId: 'button-orders' },
  { href: '/admin/products',          label: 'Products',        icon: Package,      feature: 'products',         testId: 'button-products' },
  { href: '/admin/customers',         label: 'Customers',       icon: Users,        feature: 'customers',        testId: 'button-customers' },
  { href: '/admin/banners',           label: 'Banners',         icon: TrendingUp,   feature: 'banners',          testId: 'button-banners' },
  { href: '/admin/about',             label: 'About Us',        icon: Store,        feature: 'about',            testId: 'button-about' },
  { href: '/admin/categories',        label: 'Categories',      icon: Package,      feature: 'categories',       testId: 'button-categories' },
  { href: '/admin/payments',          label: 'Payments',        icon: IndianRupee,  feature: 'payments',         testId: 'button-payments' },
  { href: '/admin/legal-pages',       label: 'Legal Pages',     icon: FileText,     feature: 'legal_pages',      testId: 'button-legal-pages' },
  { href: '/admin/testimonials',     label: 'Testimonials',    icon: MessageSquare, feature: 'testimonials',     testId: 'button-testimonials' },
  { href: '/admin/reports',           label: 'Reports',         icon: TrendingUp,   feature: 'reports',          testId: 'button-reports' },
  { href: '/admin/account',           label: 'My Account',      icon: UserCog,      feature: 'account',          testId: 'button-account' },
  { href: '/admin/contact-settings',  label: 'Contact Us',      icon: AtSign,       feature: 'contact_settings', testId: 'button-contact-settings' },
  { href: '/admin/header-settings',   label: 'Header Editor',   icon: PanelTop,     feature: 'header_settings',  testId: 'button-header-settings' },
  { href: '/admin/footer-settings',   label: 'Footer Editor',   icon: PanelBottom,  feature: 'footer_settings',  testId: 'button-footer-settings' },
  { href: '/admin/charges',           label: 'Charges',         icon: Truck,        feature: 'charges',          testId: 'button-charges' },
];

function DashboardTiles() {
  const { can, isSuperAdmin } = useAdminPermissions();
  const tiles = DASHBOARD_TILES.filter((t) => isSuperAdmin || can(t.feature));
  if (tiles.length === 0) {
    return (
      <div className="border border-stone-200 bg-stone-50 rounded-lg p-8 mb-8 text-center">
        <p className="text-slate-600">You don't have access to any features yet. Please contact the super admin.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-8">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href}>
            <Button
              variant="outline"
              className="h-20 w-full flex-col gap-2 border-champagne text-champagne hover:bg-champagne hover:text-navy"
              data-testid={t.testId}
            >
              <Icon className="h-6 w-6" />
              <span>{t.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
