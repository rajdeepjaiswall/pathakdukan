import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { CheckCircle, Package, ArrowRight, Clock, MapPin, User, Phone, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import MobileNav from '@/components/layout/mobile-nav';
import { formatPrice } from '@/lib/cart';
import pathakLogo from '@assets/project_20250528_0859055-02.png';
import bakeryPattern from '@assets/project_20250607_1604012-01_1749292781428.png';
import { ShopClosedNotice } from '@/components/shop-closed-notice';

export default function OrderConfirmation() {
  const [, setLocation] = useLocation();
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // Get order details from localStorage (set during checkout)
    const storedOrderDetails = localStorage.getItem('lastOrderDetails');
    if (storedOrderDetails) {
      setOrderDetails(JSON.parse(storedOrderDetails));
      // Clear the stored order details after displaying
      localStorage.removeItem('lastOrderDetails');
    } else {
      // If no order details found, redirect to home
      setTimeout(() => setLocation('/'), 3000);
    }
  }, [setLocation]);

  // Helper function to get status display information
  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { label: 'Order Received', color: 'bg-blue-100 text-blue-800', description: 'Your order has been received and is being processed' },
      getting_ready: { label: 'Getting Ready', color: 'bg-yellow-100 text-yellow-800', description: 'Our chefs are preparing your delicious items' },
      packed: { label: 'Packed', color: 'bg-purple-100 text-purple-800', description: 'Your order is packed and ready for dispatch' },
      dispatched: { label: 'Dispatched', color: 'bg-orange-100 text-orange-800', description: 'Your order has been dispatched from our kitchen' },
      shipped: { label: 'Out for Delivery', color: 'bg-blue-100 text-blue-800', description: 'Your order is on the way to you' },
      delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', description: 'Your order has been delivered successfully' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', description: 'This order has been cancelled' }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(orderDetails.status);

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      {/* Background Pattern */}
      <div 
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `url(${bakeryPattern})`,
          backgroundSize: '200px 200px',
          backgroundRepeat: 'repeat'
        }}
      />
      
      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          {/* Pathak Bhandar Logo */}
          <div className="mb-6">
            <img 
              src={pathakLogo} 
              alt="Pathak Bhandar" 
              className="h-16 mx-auto"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-navy mb-4">
            Thank You for Your Order!
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Your order has been successfully placed
          </p>
          <p className="text-sm text-gray-500">
            Order #{orderDetails.orderNumber}
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="mb-8 border-champagne/30 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-navy mb-4">Order Summary</h2>
            
            <div className="space-y-4">
              {/* Delivery Information */}
              <div className="bg-almond/20 p-4 rounded-lg">
                <h3 className="font-medium text-navy mb-2">Delivery Address</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="font-medium">{orderDetails.deliveryAddress?.name}</p>
                  <p>{orderDetails.deliveryAddress?.addressLine1}</p>
                  {orderDetails.deliveryAddress?.addressLine2 && (
                    <p>{orderDetails.deliveryAddress.addressLine2}</p>
                  )}
                  <p>
                    {orderDetails.deliveryAddress?.city}, {orderDetails.deliveryAddress?.state} - {orderDetails.deliveryAddress?.pincode}
                  </p>
                  <p className="flex items-center gap-1">
                    📞 {orderDetails.deliveryAddress?.phone}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-navy mb-2">Payment Method</h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : orderDetails.paymentMethod}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-navy mb-2">Total Amount</h3>
                  <p className="text-lg font-bold text-navy">
                    {formatPrice(parseFloat(orderDetails.total))}
                  </p>
                </div>
              </div>

              {/* Order Status */}
              <div className={`p-4 rounded-lg border ${statusInfo.color.includes('green') ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-3">
                  <CheckCircle className={`w-5 h-5 ${statusInfo.color.includes('green') ? 'text-green-600' : 'text-blue-600'}`} />
                  <div className="flex-1">
                    <h3 className={`font-medium ${statusInfo.color.includes('green') ? 'text-green-800' : 'text-blue-800'}`}>Order Status</h3>
                    <p className={`text-sm ${statusInfo.color.includes('green') ? 'text-green-600' : 'text-blue-600'}`}>
                      {statusInfo.label} - {statusInfo.description}
                    </p>
                  </div>
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                </div>
              </div>

              {/* Rider Information (if assigned) */}
              {orderDetails.riderName && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h3 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Delivery Agent Assigned
                  </h3>
                  <div className="flex items-center gap-4">
                    {orderDetails.riderImage && (
                      <img
                        src={orderDetails.riderImage}
                        alt={orderDetails.riderName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-yellow-300"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-yellow-800">{orderDetails.riderName}</p>
                      {orderDetails.riderPhone && (
                        <p className="text-sm text-yellow-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {orderDetails.riderPhone}
                        </p>
                      )}
                    </div>
                  </div>
                  {orderDetails.estimatedDelivery && (
                    <div className="mt-3 pt-3 border-t border-yellow-200">
                      <p className="text-sm text-yellow-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Estimated delivery: {new Date(orderDetails.estimatedDelivery).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shop Closed Notice */}
        <ShopClosedNotice variant="confirmation" />

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link href="/customer/orders">
            <Button className="w-full bg-navy text-white hover:bg-navy/90 py-6 text-lg font-medium">
              <Package className="w-5 h-5 mr-3" />
              Track Your Order
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </Link>
          
          <div className="grid grid-cols-2 gap-4">
            <Link href="/">
              <Button variant="outline" className="w-full border-champagne text-navy hover:bg-champagne/10">
                Continue Shopping
              </Button>
            </Link>
            
            <Link href="/customer/orders">
              <Button variant="outline" className="w-full border-navy text-navy hover:bg-navy/5">
                View All Orders
              </Button>
            </Link>
          </div>

          {/* Cancellation Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-yellow-800 text-center">
              <strong>Note:</strong> Orders can only be cancelled within the first few minutes after placing. 
              Once preparation begins, rejection charges may apply.
            </p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center">
          <div className="bg-white/80 p-6 rounded-lg border border-champagne/30">
            <h3 className="font-medium text-navy mb-3">What happens next?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>✅ Order confirmation sent to your phone</p>
              <p>🍪 Our bakers will prepare your fresh items</p>
              <p>🚚 We'll deliver to your doorstep</p>
              <p>💰 Pay conveniently when you receive your order</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact us at support@pathakbhandar.com</p>
          <p>or call +91-XXX-XXX-XXXX</p>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}