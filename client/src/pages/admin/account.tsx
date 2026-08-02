import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User as UserIcon, KeyRound, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';

interface AdminAccount {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: 'admin' | 'super_admin';
}

export default function AdminAccount() {
  const { user, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  // Password change state
  const [pwStep, setPwStep] = useState<'idle' | 'otp_sent' | 'submitting'>('idle');
  const [adminOtp, setAdminOtp] = useState('');
  const [superAdminOtp, setSuperAdminOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpInfo, setOtpInfo] = useState<{
    requiresSuperAdminOtp: boolean;
    adminPhoneMasked: string;
    superAdminPhoneMasked: string | null;
  } | null>(null);

  const { data: account, isLoading } = useQuery<AdminAccount>({
    queryKey: ['/api/admin/account'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/account');
      return res.json();
    },
  });

  useEffect(() => {
    if (account) {
      setFirstName(account.firstName);
      setLastName(account.lastName);
      setPhone(account.phone);
    }
  }, [account]);

  // Save profile
  const saveProfileMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', '/api/admin/account', { firstName, lastName, phone });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Profile updated', description: 'Your details have been saved.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/account'] });
      // Sync with auth context
      if (user) {
        updateUser({
          ...(user as any),
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
        });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Could not save', description: error.message || 'Please try again.', variant: 'destructive' });
    },
  });

  // Step 1: send OTPs
  const initOtpMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/account/change-password/init', {});
      return res.json();
    },
    onSuccess: (data) => {
      setOtpInfo({
        requiresSuperAdminOtp: data.requiresSuperAdminOtp,
        adminPhoneMasked: data.adminPhoneMasked,
        superAdminPhoneMasked: data.superAdminPhoneMasked,
      });
      setPwStep('otp_sent');
      toast({
        title: 'OTPs sent',
        description: data.requiresSuperAdminOtp
          ? 'Codes sent to your WhatsApp and to the Super Admin\'s WhatsApp.'
          : 'Code sent to your WhatsApp.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Could not send OTP', description: error.message || 'Please try again.', variant: 'destructive' });
    },
  });

  // Step 2: verify and update password
  const verifyMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/account/change-password/verify', {
        adminOtp,
        superAdminOtp: otpInfo?.requiresSuperAdminOtp ? superAdminOtp : undefined,
        newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Password updated', description: 'Your new password is now active. Please log in again next time.' });
      setPwStep('idle');
      setAdminOtp('');
      setSuperAdminOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpInfo(null);
    },
    onError: (error: any) => {
      toast({ title: 'Verification failed', description: error.message || 'Please check the OTPs and try again.', variant: 'destructive' });
    },
  });

  const onChangePasswordClick = () => {
    if (!account?.phone) {
      toast({
        title: 'Add WhatsApp number first',
        description: 'Save your WhatsApp number in the Profile section above before changing your password.',
        variant: 'destructive',
      });
      return;
    }
    initOtpMut.mutate();
  };

  const onVerifyClick = () => {
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Minimum 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (adminOtp.length !== 6) {
      toast({ title: 'Enter your 6-digit OTP', variant: 'destructive' });
      return;
    }
    if (otpInfo?.requiresSuperAdminOtp && superAdminOtp.length !== 6) {
      toast({ title: "Enter the Super Admin's 6-digit OTP", variant: 'destructive' });
      return;
    }
    verifyMut.mutate();
  };

  if (isLoading || !account) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="animate-pulse h-48 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <UserIcon className="h-8 w-8 text-champagne" />
          <h1 className="text-3xl font-bold text-navy">My Account</h1>
        </div>

        {/* Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input value={account.username} disabled data-testid="input-username" />
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  data-testid="input-first-name"
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <Smartphone className="h-3.5 w-3.5" /> WhatsApp Number
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                data-testid="input-phone"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for sending OTPs when you change your password. Include the country code.
              </p>
            </div>
            <Button
              onClick={() => saveProfileMut.mutate()}
              disabled={saveProfileMut.isPending}
              className="bg-champagne text-navy hover:bg-champagne/90"
              data-testid="button-save-profile"
            >
              {saveProfileMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pwStep === 'idle' && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-gray-700">
                  <p className="font-semibold mb-1 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-700" /> Two-step verification
                  </p>
                  {account.role === 'super_admin' ? (
                    <p>A 6-digit OTP will be sent to your registered WhatsApp number. Enter it along with your new password to update.</p>
                  ) : (
                    <p>
                      A 6-digit OTP will be sent to <strong>your</strong> registered WhatsApp number AND another 6-digit OTP to the
                      <strong> Super Admin's</strong> WhatsApp. Both OTPs must be entered correctly to set your new password.
                    </p>
                  )}
                </div>
                <Button
                  onClick={onChangePasswordClick}
                  disabled={initOtpMut.isPending}
                  className="bg-navy text-white hover:bg-navy/90"
                  data-testid="button-init-change-password"
                >
                  {initOtpMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Send OTP and Change Password
                </Button>
              </>
            )}

            {pwStep === 'otp_sent' && otpInfo && (
              <>
                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-gray-700 space-y-1">
                  <p>OTP sent to your WhatsApp: <strong>{otpInfo.adminPhoneMasked}</strong></p>
                  {otpInfo.requiresSuperAdminOtp && otpInfo.superAdminPhoneMasked && (
                    <p>OTP sent to Super Admin's WhatsApp: <strong>{otpInfo.superAdminPhoneMasked}</strong></p>
                  )}
                  <p className="text-xs text-gray-500">OTPs expire in 5 minutes.</p>
                </div>
                <div>
                  <Label>Your OTP</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    value={adminOtp}
                    onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    data-testid="input-admin-otp"
                  />
                </div>
                {otpInfo.requiresSuperAdminOtp && (
                  <div>
                    <Label>Super Admin's OTP</Label>
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      value={superAdminOtp}
                      onChange={(e) => setSuperAdminOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit code"
                      data-testid="input-superadmin-otp"
                    />
                    <p className="text-xs text-gray-500 mt-1">Ask the Super Admin to share the code they received on WhatsApp.</p>
                  </div>
                )}
                <Separator className="my-2" />
                <div>
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    data-testid="input-new-password"
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={onVerifyClick}
                    disabled={verifyMut.isPending}
                    className="bg-champagne text-navy hover:bg-champagne/90"
                    data-testid="button-verify-and-set"
                  >
                    {verifyMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Verify and Set Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPwStep('idle');
                      setAdminOtp('');
                      setSuperAdminOtp('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setOtpInfo(null);
                    }}
                    data-testid="button-cancel-password"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => initOtpMut.mutate()}
                    disabled={initOtpMut.isPending}
                    data-testid="button-resend-otps"
                  >
                    {initOtpMut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Resend OTPs
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
