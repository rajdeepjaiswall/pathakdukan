import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Send, Download } from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  // Redirect if not super admin
  if (!user || user.role !== 'super_admin') {
    setLocation('/admin/login');
    return null;
  }

  // Fetch API status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/otp-status');
        const data = await response.json();
        setStatus(data);
      } catch (error: any) {
        console.error('Failed to fetch OTP status:', error);
        setStatus({ configured: false, message: 'Unable to fetch status' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Test OTP mutation
  const testOtpMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/test-otp', {
        phoneNumber: '+919876543210', // Test number
      });
    },
    onSuccess: () => {
      toast({
        title: 'Test Sent',
        description: 'Test OTP has been sent. Check if you received the WhatsApp message.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Test Failed',
        description: error.message || 'Failed to send test OTP',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-white to-cream">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy mb-2">Fast2SMS WhatsApp Setup</h1>
          <p className="text-gray-600">Configure your OTP verification service</p>
        </div>

        {/* Setup Instructions Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-navy flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              How to Add Your Fast2SMS API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs">1</div>
                <div>
                  <p className="font-semibold text-navy">Open Secrets in Replit</p>
                  <p className="text-gray-600">In the left sidebar, click on the <strong>Secrets</strong> (🔒) tab</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs">2</div>
                <div>
                  <p className="font-semibold text-navy">Find or Create FAST2SMS_API_KEY</p>
                  <p className="text-gray-600">Look for <code className="bg-gray-100 px-2 py-1 rounded text-xs">FAST2SMS_API_KEY</code> or add it if missing</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs">3</div>
                <div>
                  <p className="font-semibold text-navy">Paste Your API Key</p>
                  <p className="text-gray-600">Copy your Fast2SMS API key and paste it in the value field</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs">4</div>
                <div>
                  <p className="font-semibold text-navy">Save & Restart</p>
                  <p className="text-gray-600">The app will automatically restart. Then test the connection below.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Status Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className={`border-b ${status?.configured ? 'bg-green-50' : 'bg-orange-50'}`}>
            <CardTitle className="text-navy flex items-center gap-2">
              {status?.configured ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  API Connected & Ready
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  API Not Yet Configured
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-navy mb-2">Status Details:</p>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-center gap-2">
                      {status?.configured ? (
                        <span className="h-2 w-2 bg-green-600 rounded-full"></span>
                      ) : (
                        <span className="h-2 w-2 bg-orange-600 rounded-full"></span>
                      )}
                      <span>
                        {status?.configured ? '✓ API Key is configured' : '✗ API Key not found'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                      <span>Sender ID: {status?.senderId || 'GETDWN'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                      <span>Template ID: {status?.templateId || '148245'}</span>
                    </li>
                  </ul>
                </div>

                {/* Test OTP Button */}
                {status?.configured && (
                  <Button
                    onClick={() => testOtpMutation.mutate()}
                    disabled={testOtpMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 flex items-center justify-center gap-2"
                    data-testid="button-test-otp"
                  >
                    <Send className="h-4 w-4" />
                    {testOtpMutation.isPending ? 'Sending Test...' : 'Send Test OTP'}
                  </Button>
                )}

                {/* Refresh Status Button */}
                <Button
                  onClick={() => {
                    setIsLoading(true);
                    window.location.reload();
                  }}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  data-testid="button-refresh-status"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Status
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Export Card */}
        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader className="bg-amber-50 border-b">
            <CardTitle className="text-navy flex items-center gap-2">
              <Download className="h-5 w-5 text-amber-600" />
              Download Full Database Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Downloads all your data — products, orders, customers, categories, banners, and more — as a MySQL <code className="bg-gray-100 px-1 rounded text-xs">.sql</code> file. You can import it directly into any MySQL or cPanel database.
              </p>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 flex items-center justify-center gap-2"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const res = await fetch('/api/admin/export-database', {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (!res.ok) throw new Error('Download failed');
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pathak-bhandar-db-export-${new Date().toISOString().slice(0, 10)}.sql`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  } catch {
                    alert('Download failed. Please make sure you are logged in as admin.');
                  }
                }}
              >
                <Download className="h-4 w-4" />
                Download MySQL Backup (.sql)
              </Button>
              <p className="text-xs text-gray-400 text-center">
                File will be named: pathak-bhandar-db-export-{new Date().toISOString().slice(0, 10)}.sql
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Info */}
        <Card className="mt-6 border-0 shadow-lg">
          <CardHeader className="bg-gray-50 border-b">
            <CardTitle className="text-navy">WhatsApp OTP Configuration</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-navy mb-1">Message Format:</p>
                <code className="bg-gray-100 px-3 py-2 rounded block text-xs">CustomerName|OTP|</code>
              </div>
              <div>
                <p className="font-semibold text-navy mb-1">Template ID:</p>
                <p className="text-gray-600">148245</p>
              </div>
              <div>
                <p className="font-semibold text-navy mb-1">When OTP is Sent:</p>
                <ul className="text-gray-600 space-y-1 list-disc list-inside">
                  <li>Customer verifies phone at checkout</li>
                  <li>Customer requests OTP resend</li>
                  <li>Order confirmation (after payment)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
