import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { verifyOTP, sendOTP } from '@/lib/auth';
import { useAuth } from '@/hooks/use-auth';

interface OTPVerificationProps {
  phone: string;
  onSuccess: () => void;
  onBack: () => void;
}

export default function OTPVerification({ phone, onSuccess, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOTP(phone, otp);
      login(response.user, response.token);
      toast({
        title: 'Success',
        description: 'Successfully logged in',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Invalid OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await sendOTP(phone);
      toast({
        title: 'OTP Sent',
        description: 'A new OTP has been sent to your phone',
      });
      setCountdown(30);
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-navy">Verify OTP</CardTitle>
        <CardDescription>
          We've sent a 6-digit code to {phone}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-champagne text-navy hover:bg-champagne/90"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Didn't receive the code?
            </p>
            {countdown > 0 ? (
              <p className="text-sm text-gray-500">
                Resend OTP in {countdown}s
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendOTP}
                disabled={isResending}
                className="text-champagne border-champagne hover:bg-champagne hover:text-navy"
              >
                {isResending ? 'Sending...' : 'Resend OTP'}
              </Button>
            )}
          </div>
          
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="w-full text-gray-600"
          >
            Change Phone Number
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
