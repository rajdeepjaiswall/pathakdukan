import { useState } from 'react';
import { useLocation } from 'wouter';
import { LogIn, Eye, EyeOff, Shield, MessageCircle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { login } from '@/lib/auth';

type Mode = 'password' | 'otp';
type OtpStep = 1 | 2;

export default function SuperAdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login: authLogin } = useAuth();

  // Password login state
  const [mode, setMode] = useState<Mode>('password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OTP login state
  const [otpStep, setOtpStep] = useState<OtpStep>(1);
  const [otpUsername, setOtpUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login({ username, password });
      if (response.user.role !== 'super_admin') {
        throw new Error('Unauthorized access - Super Admin privileges required');
      }
      authLogin(response.user, response.token);
      toast({ title: 'Welcome Super Admin!', description: 'Successfully logged in to super admin dashboard' });
      setLocation('/super-admin');
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message || 'Invalid credentials', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!otpUsername.trim()) {
      toast({ title: 'Username required', description: 'Please enter your username first', variant: 'destructive' });
      return;
    }
    setOtpSending(true);
    try {
      const res = await fetch('/api/auth/super-admin-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: otpUsername.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'OTP Sent', description: 'A 6-digit code has been sent to the registered WhatsApp number' });
        setOtpStep(2);
      } else {
        toast({ title: 'Failed to send OTP', description: data.message || 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not reach the server. Please try again.', variant: 'destructive' });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyAndLogin = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit code sent to your WhatsApp', variant: 'destructive' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'New password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please make sure both password fields are the same', variant: 'destructive' });
      return;
    }
    setOtpVerifying(true);
    try {
      const res = await fetch('/api/auth/super-admin-otp/reset-and-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: otpUsername.trim(), otp: otpCode.trim(), newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        authLogin(data.user, data.token);
        toast({ title: 'Welcome Super Admin!', description: 'Password updated and logged in successfully' });
        setLocation('/super-admin');
      } else {
        toast({ title: 'Verification Failed', description: data.message || 'Please try again', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Could not reach the server. Please try again.', variant: 'destructive' });
    } finally {
      setOtpVerifying(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setOtpStep(1);
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="bg-white shadow-2xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-champagne to-yellow-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="h-8 w-8 text-navy" />
            </div>
            <CardTitle className="text-2xl font-bold text-navy">Super Admin Portal</CardTitle>
            <CardDescription>Advanced system administration access</CardDescription>

            {/* Mode toggle */}
            <div className="flex rounded-lg border border-gray-200 mt-4 overflow-hidden">
              <button
                type="button"
                onClick={() => switchMode('password')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                  mode === 'password'
                    ? 'bg-navy text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <KeyRound className="h-4 w-4" />
                Password
              </button>
              <button
                type="button"
                onClick={() => switchMode('otp')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                  mode === 'otp'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp OTP
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {/* ── Password Login ── */}
            {mode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-navy font-medium">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="rajdeep"
                    className="border-gray-200 focus:ring-champagne focus:border-champagne"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-navy font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="border-gray-200 focus:ring-champagne focus:border-champagne pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-champagne to-yellow-600 text-navy hover:from-champagne/90 hover:to-yellow-600/90 font-semibold py-3 shadow-lg"
                >
                  {isLoading ? 'Authenticating...' : (
                    <><LogIn className="h-4 w-4 mr-2" />Access Super Admin Panel</>
                  )}
                </Button>
              </form>
            )}

            {/* ── WhatsApp OTP Login ── */}
            {mode === 'otp' && (
              <div className="space-y-4">
                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${otpStep >= 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                  <div className={`flex-1 h-0.5 ${otpStep === 2 ? 'bg-green-600' : 'bg-gray-200'}`} />
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${otpStep === 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                </div>

                {/* Step 1: Enter username and send OTP */}
                {otpStep === 1 && (
                  <>
                    <p className="text-sm text-gray-600">Enter your username and we'll send an OTP to the registered WhatsApp number.</p>
                    <div className="space-y-2">
                      <Label htmlFor="otp-username" className="text-navy font-medium">Username</Label>
                      <Input
                        id="otp-username"
                        type="text"
                        value={otpUsername}
                        onChange={(e) => setOtpUsername(e.target.value)}
                        placeholder="rajdeep"
                        className="border-gray-200"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpSending}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                    >
                      {otpSending ? 'Sending OTP...' : (
                        <><MessageCircle className="h-4 w-4 mr-2" />Send OTP on WhatsApp</>
                      )}
                    </Button>
                  </>
                )}

                {/* Step 2: Enter OTP and set new password */}
                {otpStep === 2 && (
                  <>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                      OTP sent to the registered WhatsApp number. Enter it below along with your new password.
                    </div>

                    <div className="space-y-2">
                      <Label className="text-navy font-medium">WhatsApp OTP</Label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit code"
                        className="border-gray-200 tracking-widest text-center text-lg font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-navy font-medium">New Password</Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          className="border-gray-200 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-navy font-medium">Confirm New Password</Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="border-gray-200 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleVerifyAndLogin}
                      disabled={otpVerifying}
                      className="w-full bg-gradient-to-r from-champagne to-yellow-600 text-navy hover:from-champagne/90 hover:to-yellow-600/90 font-semibold py-3 shadow-lg"
                    >
                      {otpVerifying ? 'Verifying...' : (
                        <><Shield className="h-4 w-4 mr-2" />Verify & Login</>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setOtpStep(1)}
                      className="w-full text-sm text-gray-500 hover:text-gray-700 underline text-center"
                    >
                      Didn't receive the OTP? Go back and resend
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Need standard admin access?</p>
              <Button
                variant="link"
                onClick={() => setLocation('/admin/login')}
                className="text-champagne hover:text-navy text-sm"
              >
                ← Admin Dashboard Login
              </Button>
            </div>

            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                <p className="text-xs text-red-800 font-medium">
                  Super Admin access grants full system control
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
