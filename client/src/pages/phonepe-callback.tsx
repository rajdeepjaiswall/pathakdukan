import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { playSuccessChime } from '@/lib/sounds';
import { useCart } from '@/hooks/use-cart';

export default function PhonePeCallback() {
  const [, setLocation] = useLocation();
  const [merchantTransactionId, setMerchantTransactionId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const { clearCart } = useCart();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Try to get txnId from hash fragment first (PhonePe preserves hash on success redirects)
    const hash = window.location.hash;
    let hashTxnId: string | null = null;
    if (hash && hash.includes('txnId=')) {
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      hashTxnId = hashParams.get('txnId');
    }
    
    // Also try query params as fallback
    const params = new URLSearchParams(window.location.search);
    const queryTxnId = params.get('txnId') || 
                       params.get('transactionId') || 
                       params.get('merchantTransactionId') ||
                       params.get('id') ||
                       params.get('orderId');
    
    // Use localStorage as last resort
    const storedTxnId = localStorage.getItem('phonepe_transaction_id');
    
    // Log all info for debugging
    console.log('PhonePe Callback - Full URL:', window.location.href);
    console.log('PhonePe Callback - Hash:', hash);
    console.log('PhonePe Callback - Hash txnId:', hashTxnId);
    console.log('PhonePe Callback - Query txnId:', queryTxnId);
    console.log('PhonePe Callback - Stored txnId:', storedTxnId);
    
    // Priority: hash fragment > query param > localStorage
    if (hashTxnId) {
      setMerchantTransactionId(hashTxnId);
      console.log('Using txnId from hash fragment:', hashTxnId);
    } else if (queryTxnId) {
      setMerchantTransactionId(queryTxnId);
      console.log('Using txnId from query param:', queryTxnId);
    } else if (storedTxnId) {
      setMerchantTransactionId(storedTxnId);
      console.log('Using txnId from localStorage:', storedTxnId);
    } else {
      console.log('No transaction ID found anywhere!');
    }
  }, []);

  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ['/api/payments/phonepe/status', merchantTransactionId],
    queryFn: async () => {
      if (!merchantTransactionId) return null;
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments/phonepe/status/${merchantTransactionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }
      return response.json();
    },
    enabled: !!merchantTransactionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'success' || data?.status === 'failed' || pollCount > 30) {
        return false;
      }
      return 3000;
    },
  });

  useEffect(() => {
    if (statusData?.status === 'pending') {
      setPollCount(prev => prev + 1);
    }
    if (statusData?.status === 'success') {
      playSuccessChime();
      clearCart();
      localStorage.removeItem('phonepe_transaction_id');
      localStorage.removeItem('pending_order_id');
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    }
  }, [statusData, clearCart, queryClient]);

  // Clear cart when landing on callback page (payment was initiated)
  useEffect(() => {
    // If we reached this page, payment was attempted - clear cart and storage
    const pendingOrderId = localStorage.getItem('pending_order_id');
    if (pendingOrderId) {
      clearCart();
      localStorage.removeItem('phonepe_transaction_id');
      localStorage.removeItem('pending_order_id');
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      playSuccessChime();
    }
  }, [clearCart, queryClient]);

  const renderContent = () => {
    if (!merchantTransactionId) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy mb-2">Payment Received!</h2>
          <p className="text-gray-600 mb-2">
            Thank you for your payment. Your order is being processed.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You can check your order status in the Orders section. If you have any questions, please contact our support.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button 
              onClick={() => setLocation('/customer/orders')} 
              className="bg-champagne text-navy hover:bg-champagne/90"
              data-testid="button-check-orders"
            >
              View My Orders
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation('/')} 
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 text-champagne animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-navy mb-2">Checking Payment Status</h2>
          <p className="text-gray-600">Please wait while we verify your payment...</p>
        </div>
      );
    }

    if (statusData?.status === 'success') {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-2">
            Your payment has been verified and your order is confirmed.
          </p>
          {statusData.transactionId && (
            <p className="text-sm text-gray-500 mb-6">
              Transaction ID: {statusData.transactionId}
            </p>
          )}
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/customer/orders')}
              data-testid="button-view-orders"
            >
              View Orders
            </Button>
            <Button 
              className="bg-champagne text-navy hover:bg-champagne/90"
              onClick={() => setLocation('/')}
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      );
    }

    if (statusData?.status === 'failed') {
      return (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">
            Unfortunately, your payment could not be processed. Please try again.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/customer/orders')}
              data-testid="button-view-orders-failed"
            >
              View Orders
            </Button>
            <Button 
              className="bg-champagne text-navy hover:bg-champagne/90"
              onClick={() => setLocation('/cart')}
              data-testid="button-try-again"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="h-12 w-12 text-yellow-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">Payment Processing</h2>
        <p className="text-gray-600 mb-4">
          Your payment is being processed. This may take a few moments.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Checking status... ({pollCount}/30)
        </p>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          data-testid="button-refresh-status"
        >
          Refresh Status
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="pt-6">
            {renderContent()}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
