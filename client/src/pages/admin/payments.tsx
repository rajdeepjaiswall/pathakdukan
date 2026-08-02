import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Upload, 
  Save, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Package,
  CreditCard,
  Loader2
} from 'lucide-react';
import { formatPrice } from '@/lib/cart';
import type { Order, User as UserType } from '@shared/schema';

interface ManualPaymentConfig {
  id?: number;
  qrImageUrl: string | null;
  upiId: string | null;
  isActive: boolean;
}

interface PendingPayment {
  id: number;
  orderId: number;
  utrReference: string | null;
  status: string;
  submittedAt: string | null;
  createdAt: string;
  order: Order;
  user: UserType;
}

export default function AdminPayments() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [qrImageUrl, setQrImageUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedPayment, setSelectedPayment] = useState<PendingPayment | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6B3E2E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  const { data: config, isLoading: configLoading } = useQuery<ManualPaymentConfig>({
    queryKey: ['/api/admin/manual-payment-config'],
  });

  const { data: pendingPayments = [], isLoading: paymentsLoading, refetch: refetchPayments } = useQuery<PendingPayment[]>({
    queryKey: ['/api/admin/pending-payments'],
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (config) {
      setQrImageUrl(config.qrImageUrl || '');
      setUpiId(config.upiId || '');
      setIsActive(config.isActive || false);
    }
  }, [config]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/manual-payment-config', {
        qrImageUrl: qrImageUrl || null,
        upiId: upiId || null,
        isActive,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/manual-payment-config'] });
      toast({
        title: 'Configuration Saved',
        description: 'Payment settings have been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save configuration',
        variant: 'destructive',
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ detailsId, status, rejectionReason }: { 
      detailsId: number; 
      status: 'success' | 'failed'; 
      rejectionReason?: string;
    }) => {
      const response = await apiRequest('POST', `/api/admin/verify-payment/${detailsId}`, {
        status,
        rejectionReason,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: variables.status === 'success' ? 'Payment Approved' : 'Payment Rejected',
        description: variables.status === 'success' 
          ? 'Order has been confirmed and customer will be notified'
          : 'Customer will be notified about the payment issue',
      });
      setVerifyDialogOpen(false);
      setSelectedPayment(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify payment',
        variant: 'destructive',
      });
    },
  });

  const handleApprovePayment = () => {
    if (selectedPayment) {
      verifyPaymentMutation.mutate({
        detailsId: selectedPayment.id,
        status: 'success',
      });
    }
  };

  const handleRejectPayment = () => {
    if (selectedPayment && rejectionReason.trim()) {
      verifyPaymentMutation.mutate({
        detailsId: selectedPayment.id,
        status: 'failed',
        rejectionReason: rejectionReason.trim(),
      });
    }
  };

  const openVerifyDialog = (payment: PendingPayment) => {
    setSelectedPayment(payment);
    setVerifyDialogOpen(true);
    setRejectionReason('');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar />
      
      <div className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy mb-2">Payment Settings</h1>
            <p className="text-gray-600">Configure QR payment and verify customer payments</p>
          </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Configuration
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Payments
              {pendingPayments.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingPayments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-blue-600" />
                  QR Code Payment Setup
                </CardTitle>
                <CardDescription>
                  Configure your UPI QR code for customers to make payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Enable QR Payment</Label>
                    <p className="text-sm text-gray-500">
                      Allow customers to pay via UPI/QR code
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    data-testid="switch-qr-enabled"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="example@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    data-testid="input-upi-id"
                  />
                  <p className="text-sm text-gray-500">
                    Your UPI ID that customers will pay to
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>QR Code Image</Label>
                  <div className="flex flex-col gap-4">
                    {qrImageUrl ? (
                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white inline-block">
                          <img 
                            src={qrImageUrl} 
                            alt="Payment QR Code" 
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('qr-upload')?.click()}
                            disabled={isUploading}
                            data-testid="button-change-qr"
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Change Image
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => setQrImageUrl('')}
                            data-testid="button-remove-qr"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-champagne hover:bg-champagne/5 transition-colors"
                        onClick={() => document.getElementById('qr-upload')?.click()}
                        data-testid="qr-upload-area"
                      >
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium">Click to upload QR code image</p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      id="qr-upload"
                      accept="image/png,image/jpeg,image/jpg"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast({
                              title: 'File too large',
                              description: 'Please upload an image smaller than 5MB',
                              variant: 'destructive',
                            });
                            return;
                          }
                          
                          setIsUploading(true);
                          try {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              setQrImageUrl(base64);
                              setIsUploading(false);
                            };
                            reader.onerror = () => {
                              toast({
                                title: 'Upload failed',
                                description: 'Failed to read the image file',
                                variant: 'destructive',
                              });
                              setIsUploading(false);
                            };
                            reader.readAsDataURL(file);
                          } catch (error) {
                            toast({
                              title: 'Upload failed',
                              description: 'Failed to process the image',
                              variant: 'destructive',
                            });
                            setIsUploading(false);
                          }
                        }
                        e.target.value = '';
                      }}
                      data-testid="input-qr-file"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload your UPI QR code image that customers will scan to pay
                  </p>
                </div>

                <Button 
                  onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending}
                  className="bg-champagne text-navy hover:bg-champagne/90"
                  data-testid="button-save-config"
                >
                  {saveConfigMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Pending Payment Verifications
                </CardTitle>
                <CardDescription>
                  Review and verify customer payment submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Loading pending payments...</p>
                  </div>
                ) : pendingPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-navy mb-2">All Caught Up!</h3>
                    <p className="text-gray-500">No pending payments to verify</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPayments.map((payment) => (
                      <div 
                        key={payment.id} 
                        className="border rounded-lg p-4 hover:border-champagne transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Order #{payment.order.orderNumber}
                              </Badge>
                              <Badge className="bg-orange-100 text-orange-700">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending Verification
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <User className="h-4 w-4" />
                                  <span>{payment.user.username || payment.user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Phone className="h-4 w-4" />
                                  <span>{payment.user.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Package className="h-4 w-4" />
                                  <span className="font-semibold text-navy">
                                    {formatPrice(parseFloat(payment.order.total))}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-gray-600" />
                                  <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                    UTR: {payment.utrReference || 'Not submitted'}
                                  </span>
                                </div>
                                <div className="text-gray-500 text-xs">
                                  Submitted: {formatDate(payment.submittedAt)}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  Order Created: {formatDate(payment.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => openVerifyDialog(payment)}
                              data-testid={`button-verify-${payment.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Review the payment details and approve or reject
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-semibold">{selectedPayment.order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-navy">
                    {formatPrice(parseFloat(selectedPayment.order.total))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">UTR Reference:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded text-sm">
                    {selectedPayment.utrReference || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span>{selectedPayment.user.username || selectedPayment.user.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  data-testid="input-rejection-reason"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setVerifyDialogOpen(false)}
              data-testid="button-cancel-verify"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectPayment}
              disabled={!rejectionReason.trim() || verifyPaymentMutation.isPending}
              data-testid="button-reject-payment"
            >
              {verifyPaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApprovePayment}
              disabled={verifyPaymentMutation.isPending}
              data-testid="button-approve-payment"
            >
              {verifyPaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}
