import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Wallet, 
  CheckCircle, 
  XCircle, 
  Settings, 
  Eye, 
  EyeOff,
  Save,
  TestTube,
  AlertTriangle,
  Power,
  WifiOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { PaymentGatewayConfig } from '@shared/schema';

const PAYMENT_PROVIDERS = [
  { id: 'razorpay', name: 'Razorpay', description: 'Popular Indian payment gateway' },
  { id: 'stripe', name: 'Stripe', description: 'Global payment processing' },
  { id: 'phonepe', name: 'PhonePe', description: 'UPI-based payments' },
  { id: 'paytm', name: 'Paytm', description: 'Wallet & UPI payments' },
];

export default function PaymentGatewayPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedProvider, setSelectedProvider] = useState('razorpay');
  const [showSecrets, setShowSecrets] = useState(false);
  const [formData, setFormData] = useState({
    keyId: '',
    keySecret: '',
    merchantId: '',
    isActive: false,
    isTestMode: true,
    webhookSecret: '',
  });

  if (!user && !authLoading) {
    setLocation('/admin/login');
    return null;
  }

  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    setLocation('/admin/login');
    return null;
  }

  const { data: gatewayConfigs = [], isLoading } = useQuery<PaymentGatewayConfig[]>({
    queryKey: ['/api/admin/payment-gateways'],
    enabled: !!user && (user.role === 'admin' || user.role === 'super_admin'),
  });

  const { data: paymentStatus, isLoading: statusLoading } = useQuery<{ onlinePaymentsEnabled: boolean }>({
    queryKey: ['/api/payment-status'],
  });

  const togglePaymentStatusMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiRequest('PATCH', '/api/admin/payment-status', { enabled });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/payment-status'] });
      toast({
        title: data.onlinePaymentsEnabled ? 'Online Payments Enabled' : 'Online Payments Disabled',
        description: data.onlinePaymentsEnabled
          ? 'Customers can now pay online.'
          : 'Online payments are blocked. Customers will only see Cash on Delivery.',
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Could not update payment status', variant: 'destructive' });
    },
  });

  const activeGateway = gatewayConfigs.find(g => g.isActive);
  const onlinePaymentsEnabled = paymentStatus?.onlinePaymentsEnabled ?? true;

  useEffect(() => {
    const config = gatewayConfigs.find(g => g.provider === selectedProvider);
    if (config) {
      setFormData({
        keyId: config.keyId || '',
        keySecret: config.keySecret || '',
        merchantId: config.merchantId || '',
        isActive: config.isActive || false,
        isTestMode: config.isTestMode ?? true,
        webhookSecret: config.webhookSecret || '',
      });
    } else {
      setFormData({
        keyId: '',
        keySecret: '',
        merchantId: '',
        isActive: false,
        isTestMode: true,
        webhookSecret: '',
      });
    }
  }, [selectedProvider, gatewayConfigs]);

  const saveGatewayMutation = useMutation({
    mutationFn: async (data: {
      provider: string;
      displayName: string;
      keyId: string;
      keySecret: string;
      merchantId: string;
      isActive: boolean;
      isTestMode: boolean;
      webhookSecret: string;
    }) => {
      const response = await apiRequest('POST', '/api/admin/payment-gateways', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-gateways'] });
      toast({
        title: 'Gateway Configuration Saved',
        description: `${PAYMENT_PROVIDERS.find(p => p.id === selectedProvider)?.name} settings have been updated`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save gateway configuration',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    const provider = PAYMENT_PROVIDERS.find(p => p.id === selectedProvider);
    saveGatewayMutation.mutate({
      provider: selectedProvider,
      displayName: provider?.name || selectedProvider,
      ...formData,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <AdminSidebar />
        <div className="lg:pl-64">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-1/4" />
              <div className="h-64 bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar />
      
      <div className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-navy mb-2 flex items-center gap-2">
              <Wallet className="h-8 w-8" />
              Payment Gateway
            </h1>
            <p className="text-gray-600">Configure payment gateway integration for online payments</p>
          </div>

          {/* ── Master Online Payments Switch ── */}
          <Card className={`mb-6 border-2 ${onlinePaymentsEnabled ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
            <CardContent className="py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {onlinePaymentsEnabled ? (
                    <Power className="h-6 w-6 text-green-600" />
                  ) : (
                    <WifiOff className="h-6 w-6 text-red-600" />
                  )}
                  <div>
                    <p className={`text-lg font-bold ${onlinePaymentsEnabled ? 'text-green-800' : 'text-red-800'}`}>
                      Online Payments: {onlinePaymentsEnabled ? 'ON' : 'OFF'}
                    </p>
                    <p className={`text-sm ${onlinePaymentsEnabled ? 'text-green-700' : 'text-red-700'}`}>
                      {onlinePaymentsEnabled
                        ? 'Customers can pay via UPI / QR and payment gateways.'
                        : 'Online payment options are hidden. Customers can only use Cash on Delivery.'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={onlinePaymentsEnabled}
                  onCheckedChange={(checked) => togglePaymentStatusMutation.mutate(checked)}
                  disabled={togglePaymentStatusMutation.isPending || statusLoading}
                  className="scale-125"
                />
              </div>
              {!onlinePaymentsEnabled && (
                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-800">
                  Customers visiting the payment page will see: "Online payment is not working right now — please use Cash on Delivery."
                </div>
              )}
            </CardContent>
          </Card>

          {activeGateway ? (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    Active Gateway: {activeGateway.displayName}
                  </span>
                  <Badge variant="outline" className="ml-2">
                    {activeGateway.isTestMode ? 'Test Mode' : 'Live Mode'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    No payment gateway is currently active. Configure one below to enable online payments.
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Provider</CardTitle>
                  <CardDescription>Choose a payment gateway to configure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {PAYMENT_PROVIDERS.map((provider) => {
                    const config = gatewayConfigs.find(g => g.provider === provider.id);
                    const isSelected = selectedProvider === provider.id;
                    
                    return (
                      <div
                        key={provider.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-champagne bg-champagne/10' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedProvider(provider.id)}
                        data-testid={`provider-${provider.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-navy">{provider.name}</h4>
                            <p className="text-xs text-gray-500">{provider.description}</p>
                          </div>
                          {config?.isActive && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {PAYMENT_PROVIDERS.find(p => p.id === selectedProvider)?.name} Configuration
                  </CardTitle>
                  <CardDescription>
                    Enter your API credentials to enable {PAYMENT_PROVIDERS.find(p => p.id === selectedProvider)?.name} payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Test Mode</span>
                      <span className="text-xs text-gray-500">(Use test credentials)</span>
                    </div>
                    <Switch
                      checked={formData.isTestMode}
                      onCheckedChange={(checked) => setFormData({ ...formData, isTestMode: checked })}
                      data-testid="switch-test-mode"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="keyId">API Key / Key ID</Label>
                      <Input
                        id="keyId"
                        value={formData.keyId}
                        onChange={(e) => setFormData({ ...formData, keyId: e.target.value })}
                        placeholder={`Enter ${PAYMENT_PROVIDERS.find(p => p.id === selectedProvider)?.name} API Key`}
                        data-testid="input-key-id"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="keySecret">API Secret / Key Secret</Label>
                      <div className="relative">
                        <Input
                          id="keySecret"
                          type={showSecrets ? 'text' : 'password'}
                          value={formData.keySecret}
                          onChange={(e) => setFormData({ ...formData, keySecret: e.target.value })}
                          placeholder="Enter API Secret"
                          data-testid="input-key-secret"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowSecrets(!showSecrets)}
                        >
                          {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {(selectedProvider === 'phonepe' || selectedProvider === 'paytm') && (
                      <div className="space-y-2">
                        <Label htmlFor="merchantId">Merchant ID</Label>
                        <Input
                          id="merchantId"
                          value={formData.merchantId}
                          onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                          placeholder="Enter Merchant ID"
                          data-testid="input-merchant-id"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="webhookSecret">Webhook Secret (Optional)</Label>
                      <Input
                        id="webhookSecret"
                        type={showSecrets ? 'text' : 'password'}
                        value={formData.webhookSecret}
                        onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
                        placeholder="Enter webhook secret for payment verification"
                        data-testid="input-webhook-secret"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Activate this Gateway</p>
                      <p className="text-sm text-gray-500">Enable this gateway for customer payments</p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      data-testid="switch-gateway-active"
                    />
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={saveGatewayMutation.isPending}
                    className="w-full bg-champagne text-navy hover:bg-champagne/90"
                    data-testid="button-save-gateway"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saveGatewayMutation.isPending ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
