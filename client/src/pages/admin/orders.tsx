import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Search, Filter, Download, CheckCircle, Clock, Package, Truck, User, Phone, Edit, Save, X, XCircle, AlertCircle } from 'lucide-react';
import { ShopClosedNotice } from '@/components/shop-closed-notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { formatPrice } from '@/lib/cart';
import { ORDER_STATUSES } from '@/lib/constants';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { playAdminNotification } from '@/lib/sounds';

export default function AdminOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isEditingRider, setIsEditingRider] = useState<number | null>(null);
  const [riderName, setRiderName] = useState('');
  const [riderPhone, setRiderPhone] = useState('');
  const [riderImage, setRiderImage] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const previousOrderCount = useRef<number>(0);

  // Fetch full order details (with items) when a dialog is open
  const { data: selectedOrderDetails } = useQuery({
    queryKey: ['/api/admin/orders', selectedOrder?.id, 'details'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${selectedOrder!.id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch order details');
      return response.json();
    },
    enabled: !!selectedOrder?.id,
  });

  // Wait for auth to resolve before redirecting
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#6B3E2E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#6B3E2E] text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/admin/orders', { status: statusFilter !== 'all' ? statusFilter : undefined }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      return response.json();
    },
  });

  // Play notification sound for new orders
  useEffect(() => {
    if (orders.length > 0) {
      if (previousOrderCount.current > 0 && orders.length > previousOrderCount.current) {
        // New order received, play admin notification
        playAdminNotification();
        toast({
          title: 'New Order Received!',
          description: `Order #${orders[0]?.orderNumber || 'New'} has been placed`,
          variant: 'default',
        });
      }
      previousOrderCount.current = orders.length;
    }
  }, [orders, toast]);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/admin/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: 'Status Updated',
        description: 'Order status has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    },
  });

  // Update rider assignment mutation
  const updateRiderMutation = useMutation({
    mutationFn: async ({ orderId, riderName, riderPhone, riderImage }: { orderId: number; riderName: string; riderPhone: string; riderImage?: string }) => {
      const response = await apiRequest('PUT', `/api/admin/orders/${orderId}/rider`, { 
        riderName, 
        riderPhone,
        riderImage 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setIsEditingRider(null);
      setRiderName('');
      setRiderPhone('');
      setRiderImage('');
      toast({
        title: 'Delivery Agent Assigned',
        description: 'Delivery agent has been assigned successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign delivery agent',
        variant: 'destructive',
      });
    },
  });

  // Update estimated delivery time mutation
  const updateDeliveryTimeMutation = useMutation({
    mutationFn: async ({ orderId, estimatedDelivery }: { orderId: number; estimatedDelivery: string }) => {
      const response = await apiRequest('PUT', `/api/admin/orders/${orderId}/delivery-time`, { estimatedDelivery });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: 'Delivery Time Updated',
        description: 'Estimated delivery time has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update delivery time',
        variant: 'destructive',
      });
    },
  });

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
      case 'getting_ready': return 'bg-yellow-100 text-yellow-800';
      case 'packed': return 'bg-purple-100 text-purple-800';
      case 'dispatched': return 'bg-indigo-100 text-indigo-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
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
      case 'order_received': return <CheckCircle className="h-3 w-3" />;
      case 'preparing': return <Package className="h-3 w-3" />;
      case 'dispatched': return <Truck className="h-3 w-3" />;
      case 'out_for_delivery': return <Truck className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <XCircle className="h-3 w-3" />;
      case 'payment_failed': return <AlertCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusDisplay = (status: string, paymentMethod?: string, paymentStatus?: string) => {
    // Gateway payments show as successful only if payment is explicitly completed (paid/success/completed)
    const isGatewayPaid = paymentMethod === 'gateway' && (paymentStatus === 'paid' || paymentStatus === 'success' || paymentStatus === 'completed');
    if (isGatewayPaid && status !== 'cancelled' && status !== 'payment_failed') {
      return 'Payment Successful';
    }
    switch (status) {
      case 'pending_payment': return 'Payment Pending';
      case 'payment_success': return 'Payment Successful';
      case 'confirmed': return 'Delivery Pending';
      case 'pending': return 'Pending';
      case 'getting_ready': return 'Getting Ready';
      case 'packed': return 'Packed';
      case 'dispatched': return 'Dispatched';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
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

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.deliveryAddress?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleStatusUpdate = (orderId: number, status: string) => {
    updateStatusMutation.mutate({ orderId, status });
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Orders Management</h1>
            <p className="text-gray-600">Manage and track all customer orders</p>
          </div>
          <Button className="bg-champagne text-navy hover:bg-champagne/90">
            <Download className="h-4 w-4 mr-2" />
            Export Orders
          </Button>
        </div>

        {/* Shop Closed Notice */}
        <ShopClosedNotice variant="orders" />

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="order_received">Order Received</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Orders ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No orders found</p>
                <p className="text-gray-400">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order: any) => (
                  <div key={order.id} className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${getBorderColor(order.status, order.paymentMethod, order.paymentStatus)}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-navy">#{order.orderNumber}</h3>
                          <Badge className={`capitalize ${getStatusColor(order.status, order.paymentMethod, order.paymentStatus)}`}>
                            {getStatusIcon(order.status, order.paymentMethod, order.paymentStatus)}
                            <span className="ml-1">{getStatusDisplay(order.status, order.paymentMethod, order.paymentStatus)}</span>
                          </Badge>
                        </div>
                          <div>
                            <span className="font-medium">Payment Status:</span> <span className={`font-semibold ${getStatusColor(order.status, order.paymentMethod, order.paymentStatus)} px-1.5 py-0.5 rounded-sm`}>{getStatusDisplay(order.status, order.paymentMethod, order.paymentStatus)}</span>
                          </div>
                          <div>
                            <span className="font-medium">Total:</span> {formatPrice(parseFloat(order.total))}
                          </div>
                          <div>
                            <span className="font-medium">Time:</span> {new Date(order.orderDate).toLocaleTimeString()}
                          </div>
                          <div>
                            <span className="font-medium">Payment:</span> {order.paymentMethod.toUpperCase()}
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-navy text-lg">{formatPrice(parseFloat(order.total))}</p>
                          <p className="text-sm text-gray-500">{new Date(order.orderDate).toLocaleTimeString()}</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Order Details - #{order.orderNumber}</DialogTitle>
                              </DialogHeader>
                              {selectedOrder && (
                                <div className="space-y-6">
                                  {/* Order Info */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Order Information</h4>
                                      <div className="text-sm space-y-1">
                                        <p><span className="font-medium">Status:</span> {selectedOrder.status}</p>
                                        <p><span className="font-medium">Date:</span> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                                        <p><span className="font-medium">Payment:</span> {selectedOrder.paymentMethod}</p>
                                        <p><span className="font-medium">Payment Status:</span> {selectedOrder.paymentStatus}</p>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Delivery Address</h4>
                                      <div className="text-sm space-y-1">
                                        <p>{selectedOrder.deliveryAddress?.name}</p>
                                        <p>{selectedOrder.deliveryAddress?.phone}</p>
                                        <p>{selectedOrder.deliveryAddress?.addressLine1}</p>
                                        {selectedOrder.deliveryAddress?.addressLine2 && (
                                          <p>{selectedOrder.deliveryAddress.addressLine2}</p>
                                        )}
                                        <p>{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.pincode}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Order Items */}
                                  {selectedOrderDetails?.orderItems?.length > 0 && (
                                    <div>
                                      <h4 className="font-medium mb-3">Ordered Items</h4>
                                      <div className="space-y-2">
                                        {selectedOrderDetails.orderItems.map((item: any) => (
                                          <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                                            {item.product?.images?.[0] && (
                                              <img
                                                src={item.product.images[0]}
                                                alt={item.product.name}
                                                className="w-10 h-10 object-cover rounded"
                                              />
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{item.product?.name}</p>
                                              {item.selectedWeight && (
                                                <p className="text-xs text-amber-700 font-medium">Weight: {item.selectedWeight}</p>
                                              )}
                                              <p className="text-xs text-gray-500">Qty: {item.quantity} x {formatPrice(parseFloat(item.price))}</p>
                                            </div>
                                            <span className="text-sm font-semibold">{formatPrice(parseFloat(item.total))}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Order Summary */}
                                  <div>
                                    <h4 className="font-medium mb-4">Order Summary</h4>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span>Subtotal:</span>
                                        <span>{formatPrice(parseFloat(selectedOrder.subtotal))}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>GST:</span>
                                        <span>{formatPrice(parseFloat(selectedOrder.gstAmount))}</span>
                                      </div>
                                      <div className="flex justify-between text-sm">
                                        <span>Delivery:</span>
                                        <span>{parseFloat(selectedOrder.deliveryCharge) === 0 ? 'FREE' : formatPrice(parseFloat(selectedOrder.deliveryCharge))}</span>
                                      </div>
                                      {parseFloat((selectedOrder as any).handlingCharge || '0') > 0 && (
                                        <div className="flex justify-between text-sm">
                                          <span>Handling:</span>
                                          <span>{formatPrice(parseFloat((selectedOrder as any).handlingCharge))}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Total:</span>
                                        <span>{formatPrice(parseFloat(selectedOrder.total))}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Status Update */}
                                  <div>
                                    <h4 className="font-medium mb-2">Update Status</h4>
                                    <Select 
                                      value={selectedOrder.status} 
                                      onValueChange={(status) => handleStatusUpdate(selectedOrder.id, status)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="order_received">Order Received</SelectItem>
                                        <SelectItem value="preparing">Preparing</SelectItem>
                                        <SelectItem value="dispatched">Dispatched</SelectItem>
                                        <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {/* Rider Assignment */}
                                  <div>
                                    <h4 className="font-medium mb-2">Delivery Partner</h4>
                                    {selectedOrder.riderName ? (
                                      <div className="space-y-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <p className="font-medium flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {selectedOrder.riderName}
                                              </p>
                                              {selectedOrder.riderPhone && (
                                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                                  <Phone className="h-3 w-3" />
                                                  {selectedOrder.riderPhone}
                                                </p>
                                              )}
                                            </div>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setIsEditingRider(selectedOrder.id);
                                                setRiderName(selectedOrder.riderName || '');
                                                setRiderPhone(selectedOrder.riderPhone || '');
                                              }}
                                            >
                                              <Edit className="h-3 w-3 mr-1" />
                                              Edit
                                            </Button>
                                          </div>
                                        </div>

                                        {isEditingRider === selectedOrder.id && (
                                          <div className="space-y-3 p-3 border rounded-lg">
                                            <div>
                                              <Label htmlFor="riderName">Rider Name</Label>
                                              <Input
                                                id="riderName"
                                                value={riderName}
                                                onChange={(e) => setRiderName(e.target.value)}
                                                placeholder="Enter rider name"
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="riderPhone">Rider Phone</Label>
                                              <Input
                                                id="riderPhone"
                                                value={riderPhone}
                                                onChange={(e) => setRiderPhone(e.target.value)}
                                                placeholder="Enter phone number"
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="riderImage">Rider Photo URL (optional)</Label>
                                              <Input
                                                id="riderImage"
                                                value={riderImage}
                                                onChange={(e) => setRiderImage(e.target.value)}
                                                placeholder="Enter photo URL or leave blank"
                                              />
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={() => updateRiderMutation.mutate({
                                                  orderId: selectedOrder.id,
                                                  riderName,
                                                  riderPhone,
                                                  riderImage
                                                })}
                                                disabled={updateRiderMutation.isPending}
                                              >
                                                <Save className="h-3 w-3 mr-1" />
                                                Save
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setIsEditingRider(null);
                                                  setRiderName('');
                                                  setRiderPhone('');
                                                  setRiderImage('');
                                                }}
                                              >
                                                <X className="h-3 w-3 mr-1" />
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <p className="text-sm text-gray-600">No delivery agent assigned yet</p>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setIsEditingRider(selectedOrder.id);
                                            setRiderName('');
                                            setRiderPhone('');
                                            setRiderImage('');
                                          }}
                                        >
                                          <User className="h-3 w-3 mr-1" />
                                          Assign Delivery Agent
                                        </Button>

                                        {isEditingRider === selectedOrder.id && (
                                          <div className="space-y-3 p-3 border rounded-lg">
                                            <div>
                                              <Label htmlFor="riderName">Agent Name</Label>
                                              <Input
                                                id="riderName"
                                                value={riderName}
                                                onChange={(e) => setRiderName(e.target.value)}
                                                placeholder="Enter delivery agent name"
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="riderPhone">Agent Phone</Label>
                                              <Input
                                                id="riderPhone"
                                                value={riderPhone}
                                                onChange={(e) => setRiderPhone(e.target.value)}
                                                placeholder="Enter phone number"
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="riderImageAssign">Agent Photo URL (optional)</Label>
                                              <Input
                                                id="riderImageAssign"
                                                value={riderImage}
                                                onChange={(e) => setRiderImage(e.target.value)}
                                                placeholder="Enter photo URL or leave blank"
                                              />
                                            </div>
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={() => updateRiderMutation.mutate({
                                                  orderId: selectedOrder.id,
                                                  riderName,
                                                  riderPhone,
                                                  riderImage
                                                })}
                                                disabled={updateRiderMutation.isPending}
                                              >
                                                <Save className="h-3 w-3 mr-1" />
                                                Assign Agent
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                  setIsEditingRider(null);
                                                  setRiderName('');
                                                  setRiderPhone('');
                                                  setRiderImage('');
                                                }}
                                              >
                                                <X className="h-3 w-3 mr-1" />
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Estimated Delivery Time Management */}
                                  <div>
                                    <h4 className="font-medium mb-2">Estimated Delivery Time</h4>
                                    <div className="flex items-center gap-3">
                                      <Input
                                        type="datetime-local"
                                        value={estimatedDelivery}
                                        onChange={(e) => setEstimatedDelivery(e.target.value)}
                                        className="flex-1"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (estimatedDelivery) {
                                            updateDeliveryTimeMutation.mutate({
                                              orderId: selectedOrder.id,
                                              estimatedDelivery
                                            });
                                          }
                                        }}
                                        disabled={!estimatedDelivery || updateDeliveryTimeMutation.isPending}
                                      >
                                        <Clock className="h-3 w-3 mr-1" />
                                        Update
                                      </Button>
                                    </div>
                                    {selectedOrder.estimatedDelivery && (
                                      <p className="text-sm text-gray-600 mt-2">
                                        Current: {new Date(selectedOrder.estimatedDelivery).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Select 
                            value={order.status} 
                            onValueChange={(status) => handleStatusUpdate(order.id, status)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="order_received">Order Received</SelectItem>
                              <SelectItem value="preparing">Preparing</SelectItem>
                              <SelectItem value="dispatched">Dispatched</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
