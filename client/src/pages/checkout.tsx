import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, CreditCard, Smartphone, Truck, MapPin, Plus, CheckCircle, AlertCircle, QrCode, Copy, Clock, MessageCircle, Check, Wallet, ExternalLink, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { chargeMethodSuffix, formatPrice, getGSTBreakdown, getItemPrice } from '@/lib/cart';
import { apiRequest, queryClient as globalQueryClient } from '@/lib/queryClient';
import { playSuccessChime, initializeAudioContext } from '@/lib/sounds';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertAddressSchema, type Address, type ManualPaymentConfig } from '@shared/schema';
import { z } from 'zod';
import { OTPInput } from '@/components/otp-input';
import { Progress } from '@/components/ui/progress';
import { ShopClosedNotice } from '@/components/shop-closed-notice';

const addressFormSchema = insertAddressSchema.omit({ userId: true });

type CheckoutStep = 'address' | 'payment' | 'waiting' | 'confirmation';
type PaymentMethod = 'cod' | 'qr' | 'gateway';

const CHECKOUT_STEPS = [
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'waiting', label: 'Processing', icon: Clock },
  { id: 'confirmation', label: 'Done', icon: CheckCircle },
];

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, summary, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'submitted' | 'success' | 'failed'>('pending');
  const [orderNotes, setOrderNotes] = useState('');
  
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [verifyingAddressId, setVerifyingAddressId] = useState<number | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudioContext();
      document.removeEventListener('click', handleUserInteraction);
    };
    document.addEventListener('click', handleUserInteraction);
    return () => {
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  if (!isAuthenticated) {
    toast({
      title: "Authentication Required",
      description: "Please log in to proceed with checkout",
      variant: "destructive",
    });
    setLocation('/');
    return null;
  }

  if (items.length === 0 && currentStep === 'address') {
    setLocation('/cart');
    return null;
  }

  const { data: addresses = [] } = useQuery<Address[]>({
    queryKey: ['/api/addresses'],
  });

  const { data: paymentStatusData } = useQuery<{ onlinePaymentsEnabled: boolean }>({
    queryKey: ['/api/payment-status'],
  });
  const onlinePaymentsEnabled = paymentStatusData?.onlinePaymentsEnabled ?? true;

  // Auto-switch to COD if online payments are disabled
  useEffect(() => {
    if (!onlinePaymentsEnabled && (paymentMethod === 'qr' || paymentMethod === 'gateway')) {
      setPaymentMethod('cod');
    }
  }, [onlinePaymentsEnabled, paymentMethod]);

  const { data: paymentConfig } = useQuery<{ qrImageUrl: string; upiId: string } | null>({
    queryKey: ['/api/manual-payment-config'],
    retry: false,
  });

  const { data: gatewayConfig } = useQuery<{ provider: string; displayName: string; isTestMode: boolean } | null>({
    queryKey: ['/api/payment-gateway'],
    retry: false,
  });

  const addressForm = useForm({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: 'Uttar Pradesh',
      pincode: '',
      landmark: '',
      isDefault: false,
    },
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStep === 'waiting' && createdOrderId && paymentStatus === 'submitted') {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/orders/${createdOrderId}/payment-status`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'success') {
              setPaymentStatus('success');
              setCurrentStep('confirmation');
              clearCart();
              playSuccessChime();
            } else if (data.status === 'failed') {
              setPaymentStatus('failed');
            }
          }
        } catch (error) {
          console.error('Error polling payment status:', error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [currentStep, createdOrderId, paymentStatus, clearCart]);

  const addAddressMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addressFormSchema>) => {
      const response = await apiRequest('POST', '/api/addresses', data);
      return response.json();
    },
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      setSelectedAddress(newAddress.id);
      setIsAddingAddress(false);
      addressForm.reset();
      toast({
        title: 'Address added',
        description: 'New address has been saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add address',
        variant: 'destructive',
      });
    },
  });

  const sendOTPMutation = useMutation({
    mutationFn: async ({
      phoneNumber,
      customerName,
      type = 'sms',
      purpose = 'verification'
    }: {
      phoneNumber: string;
      customerName: string;
      type?: 'sms' | 'whatsapp' | 'email';
      purpose?: string;
    }) => {
      const response = await apiRequest('POST', '/api/otp/send-otp', {
        identifier: phoneNumber,
        type: type,
        customerName: customerName,
        purpose: purpose,
      });
      return response.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      setCountdown(60);
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: async ({ phoneNumber, otp }: { phoneNumber: string; otp: string }) => {
      const response = await apiRequest('POST', '/api/otp/verify-otp', {
        identifier: phoneNumber,
        otp,
        type: 'whatsapp',
      });
      return response.json();
    },
    onSuccess: async () => {
      if (verifyingAddressId) {
        await apiRequest('POST', `/api/addresses/${verifyingAddressId}/verify-phone`, {});
        queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
        toast({
          title: 'Phone Verified',
          description: 'Your phone number has been verified successfully',
        });
        setIsVerifyingPhone(false);
        setOtpValue('');
        setOtpSent(false);
        setVerifyingAddressId(null);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      const selectedAddr = addresses.find((addr) => addr.id === selectedAddress);
      if (!selectedAddr) throw new Error('Please select a delivery address');

      const isPendingPayment = paymentMethod === 'qr' || paymentMethod === 'gateway';
      const getPaymentMethodName = () => {
        if (paymentMethod === 'qr') return 'upi';
        if (paymentMethod === 'gateway') return 'gateway';
        return 'cod';
      };
      const orderData = {
        user_id: user!.id,
        orderNumber: `PB${Date.now()}`,
        status: isPendingPayment ? 'pending_payment' : 'pending',
        subtotal: summary.subtotal.toString(),
        gstAmount: summary.gstAmount.toString(),
        deliveryCharge: summary.deliveryCharge.toString(),
        handlingCharge: summary.handlingCharge.toString(),
        total: summary.total.toString(),
        paymentMethod: getPaymentMethodName(),
        paymentStatus: isPendingPayment ? 'pending' : 'confirmed',
        deliveryAddress: {
          name: selectedAddr.name,
          phone: selectedAddr.phone,
          addressLine1: selectedAddr.addressLine1,
          addressLine2: selectedAddr.addressLine2,
          city: selectedAddr.city,
          state: selectedAddr.state,
          pincode: selectedAddr.pincode,
          landmark: selectedAddr.landmark,
        },
        notes: orderNotes,
      };

      const response = await apiRequest('POST', '/api/orders', orderData);
      const order = await response.json();

      for (const item of items) {
        const itemPrice = item.variantPrice ? parseFloat(item.variantPrice) : parseFloat(item.product.price);
        await apiRequest('POST', '/api/order-items', {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: itemPrice.toString(),
          total: (itemPrice * item.quantity).toString(),
          ...(item.selectedWeight ? { selectedWeight: item.selectedWeight } : {}),
        });
      }

      return order;
    },
    onSuccess: (order) => {
      setCreatedOrderId(order.id);
      
      if (paymentMethod === 'cod') {
        const selectedAddr = addresses.find((addr) => addr.id === selectedAddress);
        const orderDetails = {
          ...order,
          deliveryAddress: selectedAddr,
          paymentMethod: 'cod',
          total: summary.total.toString(),
          subtotal: summary.subtotal.toString(),
          gstAmount: summary.gstAmount.toString(),
          deliveryCharge: summary.deliveryCharge.toString(),
          handlingCharge: summary.handlingCharge.toString(),
        };
        localStorage.setItem('lastOrderDetails', JSON.stringify(orderDetails));
        playSuccessChime();
        clearCart();
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        toast({
          title: 'Order placed successfully!',
          description: `Order #${order.orderNumber} has been placed`,
        });
        setLocation('/order-confirmation');
      } else if (paymentMethod === 'qr') {
        setCurrentStep('waiting');
        toast({
          title: 'Order created!',
          description: 'Please complete your UPI payment',
        });
      } else if (paymentMethod === 'gateway') {
        toast({
          title: 'Order created!',
          description: 'Redirecting to payment gateway...',
        });
        initiatePhonePeMutation.mutate(order.id);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order',
        variant: 'destructive',
      });
    },
  });

  const submitUTRMutation = useMutation({
    mutationFn: async (utr: string) => {
      const response = await apiRequest('POST', `/api/orders/${createdOrderId}/submit-utr`, {
        utrReference: utr,
      });
      return response.json();
    },
    onSuccess: () => {
      setPaymentStatus('submitted');
      toast({
        title: 'UTR Submitted',
        description: 'Your payment is being verified. This may take a few minutes.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit UTR',
        variant: 'destructive',
      });
    },
  });

  const initiatePhonePeMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest('POST', '/api/payments/phonepe/initiate', {
        orderId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.redirectUrl) {
        // Use localStorage instead of sessionStorage - persists when redirecting to external payment gateway
        localStorage.setItem('phonepe_transaction_id', data.merchantTransactionId);
        localStorage.setItem('pending_order_id', createdOrderId?.toString() || '');
        window.location.href = data.redirectUrl;
      } else {
        toast({
          title: 'Payment Error',
          description: data.message || 'Failed to initiate payment',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate PhonePe payment',
        variant: 'destructive',
      });
    },
  });

  const handleVerifyPhone = (address: Address) => {
    setVerifyingAddressId(address.id);
    setIsVerifyingPhone(true);
    setOtpSent(false);
    setOtpValue('');
  };

  const handleSendOTP = (type: 'sms' | 'whatsapp' = 'sms') => {
    const address = addresses.find((a) => a.id === verifyingAddressId);
    if (address) {
      sendOTPMutation.mutate({
        phoneNumber: address.phone,
        type: type,
        customerName: address.name || user?.username || 'Customer',
        purpose: 'verification',
      });
    }
  };

  const handleResendOTP = () => {
    handleSendOTP('sms');
  };

  const handleContinueToPayment = () => {
    const selectedAddr = addresses.find((addr) => addr.id === selectedAddress);
    if (!selectedAddr) {
      toast({
        title: 'Error',
        description: 'Please select a delivery address',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedAddr.isPhoneVerified) {
      toast({
        title: 'Phone Verification Required',
        description: 'Please verify your phone number before proceeding',
        variant: 'destructive',
      });
      handleVerifyPhone(selectedAddr);
      return;
    }
    
    setCurrentStep('payment');
  };

  const handlePlaceOrder = () => {
    placeOrderMutation.mutate();
  };

  const handleCopyUPI = () => {
    if (paymentConfig?.upiId) {
      navigator.clipboard.writeText(paymentConfig.upiId);
      toast({
        title: 'Copied!',
        description: 'UPI ID copied to clipboard',
      });
    }
  };

  const handleOpenUPIApp = () => {
    if (paymentConfig?.upiId) {
      const amount = summary.total;
      const upiLink = `upi://pay?pa=${paymentConfig.upiId}&pn=Pathak%20Bhandar&am=${amount}&cu=INR`;
      window.location.href = upiLink;
    }
  };

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent(`Hi, I need help with my payment for order. My UTR is: ${utrInput}`);
    window.open(`https://wa.me/918931014976?text=${message}`, '_blank');
  };

  const getStepProgress = () => {
    const stepIndex = CHECKOUT_STEPS.findIndex(s => s.id === currentStep);
    return ((stepIndex + 1) / CHECKOUT_STEPS.length) * 100;
  };

  const gstBreakdown = getGSTBreakdown(items);

  const renderStepIndicator = () => (
    <div className="mb-8">
      <Progress value={getStepProgress()} className="h-2 mb-4" />
      <div className="flex justify-between">
        {CHECKOUT_STEPS.map((step, index) => {
          const stepIndex = CHECKOUT_STEPS.findIndex(s => s.id === currentStep);
          const isCompleted = index < stepIndex;
          const isCurrent = step.id === currentStep;
          const StepIcon = step.icon;
          
          return (
            <div 
              key={step.id} 
              className={`flex flex-col items-center ${
                isCompleted || isCurrent ? 'text-navy' : 'text-gray-400'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                isCompleted ? 'bg-green-500 text-white' : 
                isCurrent ? 'bg-champagne text-navy' : 
                'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium hidden sm:block">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {addresses.length === 0 ? (
            <p className="text-gray-600 mb-4">No saved addresses. Please add a delivery address.</p>
          ) : (
            <RadioGroup
              value={selectedAddress?.toString()}
              onValueChange={(value) => setSelectedAddress(parseInt(value))}
            >
              {addresses.map((address) => (
                <div key={address.id} className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedAddress === address.id ? 'border-champagne bg-champagne/10' : 'hover:border-gray-300'
                }`}>
                  <RadioGroupItem value={address.id.toString()} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{address.name}</span>
                      {address.isDefault && (
                        <span className="text-xs bg-champagne text-navy px-2 py-1 rounded">Default</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-gray-600">{address.phone}</p>
                      {address.isPhoneVerified ? (
                        <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Verify phone status
                          </span>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-blue-600"
                            onClick={(e) => {
                              e.preventDefault();
                              handleVerifyPhone(address);
                            }}
                            data-testid={`verify-phone-${address.id}`}
                          >
                            Verify Now
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                      {address.city}, {address.state} - {address.pincode}
                    </p>
                    {address.landmark && (
                      <p className="text-sm text-gray-500">Landmark: {address.landmark}</p>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
          )}

          <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Address</DialogTitle>
              </DialogHeader>
              <Form {...addressForm}>
                <form onSubmit={addressForm.handleSubmit((data) => addAddressMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={addressForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addressForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            onKeyPress={(e) => {
                              if (!/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            data-testid="input-address-phone" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addressForm.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address-line1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addressForm.control}
                    name="addressLine2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address-line2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addressForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addressForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={addressForm.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address-pincode" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addressForm.control}
                    name="landmark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Landmark (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-address-landmark" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-champagne text-navy hover:bg-champagne/90"
                    disabled={addAddressMutation.isPending}
                    data-testid="button-add-address"
                  >
                    {addAddressMutation.isPending ? 'Adding...' : 'Add Address'}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Any special instructions for your order..."
            rows={3}
            data-testid="input-order-notes"
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Link href="/cart">
          <Button variant="outline" data-testid="button-back-to-cart">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
        </Link>
        <Button 
          onClick={handleContinueToPayment}
          disabled={!selectedAddress}
          className="bg-champagne text-navy hover:bg-champagne/90"
          data-testid="button-continue-to-payment"
        >
          Continue to Payment
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      {/* Blocking notice when online payments are off */}
      {!onlinePaymentsEnabled && (
        <Card className="border-2 border-red-400 bg-red-50">
          <CardContent className="py-5">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <WifiOff className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-red-800">Online payment is not working right now</p>
                <p className="text-red-700 mt-1">
                  We will be back soon! Till then, please go for <strong>Cash on Delivery</strong>.
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Our team is working on restoring online payments. Sorry for the inconvenience.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Select Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
            className="space-y-3"
          >
            <div 
              className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setPaymentMethod('cod')}
              data-testid="payment-option-cod"
            >
              <RadioGroupItem value="cod" />
              <div className="flex items-center gap-2 flex-1">
                <Truck className="h-5 w-5 text-green-600" />
                <div>
                  <span className="font-semibold text-green-800">Cash on Delivery</span>
                  <p className="text-sm text-gray-600">Pay when your order arrives</p>
                </div>
              </div>
            </div>

            {paymentConfig && onlinePaymentsEnabled && (
              <div 
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'qr' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentMethod('qr')}
                data-testid="payment-option-qr"
              >
                <RadioGroupItem value="qr" />
                <div className="flex items-center gap-2 flex-1">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  <div>
                    <span className="font-semibold text-blue-800">Pay via UPI / QR Code</span>
                    <p className="text-sm text-gray-600">Scan QR or tap UPI ID to open payment apps</p>
                  </div>
                </div>
              </div>
            )}

            {gatewayConfig && onlinePaymentsEnabled && (
              <div 
                className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'gateway' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setPaymentMethod('gateway')}
                data-testid="payment-option-gateway"
              >
                <RadioGroupItem value="gateway" />
                <div className="flex items-center gap-2 flex-1">
                  <Wallet className="h-5 w-5 text-purple-600" />
                  <div>
                    <span className="font-semibold text-purple-800">Pay via {gatewayConfig.displayName}</span>
                    <p className="text-sm text-gray-600">
                      Cards, UPI, Net Banking & more
                      {gatewayConfig.isTestMode && <span className="ml-1 text-orange-500">(Test Mode)</span>}
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </RadioGroup>
        </CardContent>
      </Card>

      <ShopClosedNotice variant="checkout" />

      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('address')}
          data-testid="button-back-to-address"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Address
        </Button>
        <Button 
          onClick={handlePlaceOrder}
          disabled={placeOrderMutation.isPending}
          className="bg-champagne text-navy hover:bg-champagne/90"
          data-testid="button-place-order"
        >
          {placeOrderMutation.isPending ? 'Processing...' : 
            paymentMethod === 'cod' ? 'Place Order' : 
            paymentMethod === 'gateway' ? 'Pay Now' : 
            'Proceed to Payment'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderWaitingStep = () => {
    if (paymentMethod === 'gateway') {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payment Gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4 py-8">
                <div className="bg-purple-50 p-6 rounded-lg">
                  <p className="text-2xl font-bold text-navy mb-2">
                    Amount: {formatPrice(summary.total)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Order #{createdOrderId ? `PB${createdOrderId}` : 'Processing...'}
                  </p>
                </div>
                
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Wallet className="h-8 w-8 text-purple-600" />
                </div>
                
                <h3 className="text-xl font-semibold text-navy">Payment Gateway Integration</h3>
                <p className="text-gray-600">
                  {gatewayConfig?.displayName || 'Payment gateway'} integration is being set up.
                  {gatewayConfig?.isTestMode && <span className="block text-orange-500 text-sm mt-1">(Currently in Test Mode)</span>}
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-yellow-800">
                    Payment gateway redirect will be available once the admin completes the gateway configuration with API credentials.
                  </p>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <Button 
                    onClick={() => {
                      setPaymentMethod('qr');
                      setPaymentStatus('pending');
                    }}
                    variant="outline"
                    className="w-full"
                    data-testid="button-switch-to-qr"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Pay via QR/UPI Instead
                  </Button>
                  <Button 
                    onClick={handleWhatsAppSupport}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    data-testid="button-gateway-support"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Complete Your Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentStatus === 'pending' && (
              <>
                <div className="text-center space-y-4">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-2xl font-bold text-navy mb-2">
                      Amount to Pay: {formatPrice(summary.total)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Scan the QR code or use UPI ID to make payment
                    </p>
                  </div>

                  {paymentConfig?.qrImageUrl && (
                    <div className="flex justify-center">
                      <img 
                        src={paymentConfig.qrImageUrl} 
                        alt="Payment QR Code" 
                        className="w-64 h-64 object-contain border rounded-lg"
                      />
                    </div>
                  )}

                  {paymentConfig?.upiId && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 p-3 bg-gray-100 rounded-lg">
                        <span className="font-mono font-medium">{paymentConfig.upiId}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleCopyUPI}
                          data-testid="button-copy-upi"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button 
                        onClick={handleOpenUPIApp}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        data-testid="button-open-upi"
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        Open UPI App
                      </Button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6 space-y-4">
                  <Label>Enter UTR / Transaction Reference Number</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      placeholder="Enter 12-digit UTR number"
                      className="flex-1"
                      data-testid="input-utr"
                    />
                    <Button 
                      onClick={() => submitUTRMutation.mutate(utrInput)}
                      disabled={utrInput.length < 6 || submitUTRMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-submit-utr"
                    >
                      {submitUTRMutation.isPending ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    You can find the UTR number in your UPI app's transaction history
                  </p>
                </div>
              </>
            )}

            {paymentStatus === 'submitted' && (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="h-8 w-8 text-yellow-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-navy">Payment Verification in Progress</h3>
                <p className="text-gray-600">
                  We're verifying your payment. This usually takes a few minutes.
                </p>
                <p className="text-sm text-gray-500">
                  You can close this page - we'll notify you once verified.
                </p>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="text-center space-y-4 py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-red-600">Payment Verification Failed</h3>
                <p className="text-gray-600">
                  We couldn't verify your payment. Please contact support for assistance.
                </p>
                <Button 
                  onClick={handleWhatsAppSupport}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-whatsapp-support"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Support on WhatsApp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderConfirmationStep = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been confirmed and will be processed shortly.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/customer/orders">
              <Button variant="outline" data-testid="button-view-orders">
                View Orders
              </Button>
            </Link>
            <Link href="/">
              <Button className="bg-champagne text-navy hover:bg-champagne/90" data-testid="button-continue-shopping">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderOrderSummary = () => (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <img
                src={item.product.images[0] || '/placeholder-product.jpg'}
                alt={item.product.name}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-navy truncate">{item.product.name}</p>
                {item.selectedWeight && (
                  <p className="text-xs text-champagne font-medium">Weight: {item.selectedWeight}</p>
                )}
                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">
                  {formatPrice(getItemPrice(item) * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">{formatPrice(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">CGST</span>
            <span className="font-medium">{formatPrice(gstBreakdown.cgst)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">SGST</span>
            <span className="font-medium">{formatPrice(gstBreakdown.sgst)}</span>
          </div>
          {summary.deliveryActive && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery{chargeMethodSuffix(summary.deliveryMethod, summary.deliveryPercentage, summary.deliveryCharge)}</span>
              <span className="font-medium text-green-600">
                {summary.deliveryCharge === 0 ? 'FREE' : formatPrice(summary.deliveryCharge)}
              </span>
            </div>
          )}
          {summary.handlingActive && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Handling{chargeMethodSuffix(summary.handlingMethod, summary.handlingPercentage, summary.handlingCharge)}</span>
              <span className="font-medium text-green-600">
                {summary.handlingCharge === 0 ? 'FREE' : formatPrice(summary.handlingCharge)}
              </span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-navy">{formatPrice(summary.total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-navy">Checkout</h1>
        </div>

        {renderStepIndicator()}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 'address' && renderAddressStep()}
            {currentStep === 'payment' && renderPaymentStep()}
            {currentStep === 'waiting' && renderWaitingStep()}
            {currentStep === 'confirmation' && renderConfirmationStep()}
          </div>

          {currentStep !== 'confirmation' && (
            <div className="lg:col-span-1">
              {renderOrderSummary()}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isVerifyingPhone} onOpenChange={setIsVerifyingPhone}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <Smartphone className="h-6 w-6 text-green-600" />
              Verify Phone Number
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-8 text-center space-y-8">
            {!otpSent ? (
              <div className="space-y-6">
                <p className="text-lg text-gray-600">
                  We'll send a verification code to <span className="font-bold text-navy">{addresses.find(a => a.id === verifyingAddressId)?.phone}</span>
                </p>
                <div className="grid grid-cols-1 gap-4">
                  <Button 
                    onClick={() => handleSendOTP('sms')}
                    disabled={sendOTPMutation.isPending || countdown > 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-8 text-xl font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                    data-testid="button-verify-sms"
                  >
                    <Smartphone className="h-6 w-6 mr-3" />
                    Verify via SMS
                  </Button>
                  <Button 
                    onClick={() => handleSendOTP('whatsapp')}
                    disabled={sendOTPMutation.isPending || countdown > 0}
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-8 text-xl font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02]"
                    data-testid="button-verify-whatsapp"
                  >
                    <MessageCircle className="h-6 w-6 mr-3" />
                    Verify via WhatsApp
                  </Button>
                </div>
                {countdown > 0 && (
                  <p className="text-sm font-medium text-orange-600 bg-orange-50 py-2 rounded-full">
                    Resend available in {countdown} seconds
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-gray-600">
                  Enter the 6-digit code sent to your phone
                </p>
                <div className="flex justify-center scale-110 py-4">
                  <OTPInput
                    value={otpValue}
                    onChange={setOtpValue}
                    data-testid="input-otp"
                    disabled={verifyOTPMutation.isPending}
                  />
                </div>
                <div className="space-y-3">
                  <Button 
                    onClick={() => {
                      const address = addresses.find(a => a.id === verifyingAddressId);
                      if (address && otpValue.length === 6) {
                        verifyOTPMutation.mutate({ phoneNumber: address.phone, otp: otpValue });
                      }
                    }}
                    className="w-full bg-navy text-white hover:bg-navy/90 py-6 text-lg font-bold rounded-xl"
                    disabled={otpValue.length !== 6 || verifyOTPMutation.isPending}
                    data-testid="button-confirm-otp"
                  >
                    {verifyOTPMutation.isPending ? 'Verifying...' : 'Verify & Continue'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-gray-500 hover:text-navy"
                    onClick={() => setOtpSent(false)}
                    disabled={verifyOTPMutation.isPending}
                  >
                    Try another method
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
      <MobileNav />
    </div>
  );
}
