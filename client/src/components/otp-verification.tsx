import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, MessageCircle, CheckCircle2, AlertCircle, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OTPVerificationProps {
  onVerificationSuccess?: (identifier: string, type: 'email' | 'whatsapp' | 'sms') => void;
  purpose?: string;
  className?: string;
}

export function OTPVerification({ onVerificationSuccess, purpose = "verification", className }: OTPVerificationProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp' | 'sms'>('sms');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const { toast } = useToast();

  const sendOTP = async () => {
    if (!identifier.trim()) {
      setMessage(`Please enter your ${activeTab === 'email' ? 'email address' : 'phone number'}`);
      setMessageType('error');
      return;
    }

    // Basic validation
    if (activeTab === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    if ((activeTab === 'whatsapp' || activeTab === 'sms') && !/^\+?[\d\s\-\(\)]{10,15}$/.test(identifier)) {
      setMessage('Please enter a valid phone number');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: identifier.trim(),
          type: activeTab,
          name: 'Customer',
          identifier: identifier.trim() // Support both naming conventions
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`OTP sent successfully via ${methodText}`);
        setMessageType('success');
        setStep('verify');
        toast({
          title: "OTP Sent Successfully",
          description: `Your OTP has been sent via ${methodText}. It will expire in 5 minutes.`,
        });
      } else {
        setMessage(data.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to send OTP. Please check your connection and try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setMessage('Please enter the 6-digit OTP');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/otp/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          phone: identifier.trim(), // Send both for compatibility
          otp: otp.trim(),
          type: activeTab
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Verification successful!');
        setMessageType('success');
        toast({
          title: "Verification Successful",
          description: "Your identity has been verified successfully.",
        });
        
        // Call success callback if provided
        onVerificationSuccess?.(identifier, activeTab);
      } else {
        setMessage(data.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Failed to verify OTP. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: identifier.trim(),
          type: activeTab,
          name: 'Customer',
          identifier: identifier.trim() // Support both naming conventions
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('OTP resent successfully');
        setMessageType('success');
        setOtp(''); // Clear previous OTP
        startCooldown();
        toast({
          title: "OTP Resent",
          description: data.message,
        });
      } else {
        setMessage(data.message);
        setMessageType('error');
        
        if (data.waitTime) {
          setResendCooldown(data.waitTime);
          startCooldown(data.waitTime);
        }
      }
    } catch (error) {
      setMessage('Failed to resend OTP. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const startCooldown = (seconds: number = 60) => {
    setResendCooldown(seconds);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetForm = () => {
    setStep('input');
    setIdentifier('');
    setOtp('');
    setMessage('');
    setResendCooldown(0);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'email' | 'whatsapp' | 'sms');
    resetForm();
  };

  return (
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-primary" />
          OTP Verification
        </CardTitle>
        <CardDescription>
          Verify your identity using SMS, Email, or WhatsApp
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sms" className="flex items-center gap-1">
              <Smartphone className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sms" className="space-y-4 mt-4">
            {step === 'input' ? (
              <div className="space-y-2">
                <Label htmlFor="sms-phone">Phone Number</Label>
                <Input
                  id="sms-phone"
                  type="tel"
                  placeholder="Enter your 10-digit mobile number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  data-testid="input-sms-phone"
                />
                <p className="text-sm text-muted-foreground">
                  We'll send an OTP via SMS to this number
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sms-otp" className="text-base font-medium mb-3 block">Enter OTP Code</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check your SMS. OTP sent to: <span className="font-medium text-foreground">{identifier}</span>
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length === 1) {
                          setOtp(otp.substring(0, index) + value + otp.substring(index + 1));
                          if (index < 5) {
                            const nextInput = (e.target as HTMLInputElement).parentElement?.children[index + 1] as HTMLInputElement;
                            nextInput?.focus();
                          }
                        }
                      }}
                      disabled={loading}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      data-testid={`otp-box-sms-${index}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  (Master OTP for testing: 565656)
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="email" className="space-y-4 mt-4">
            {step === 'input' ? (
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email-otp" className="text-base font-medium mb-3 block">Enter OTP Code</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check your email. OTP sent to: <span className="font-medium text-foreground">{identifier}</span>
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length === 1) {
                          setOtp(otp.substring(0, index) + value + otp.substring(index + 1));
                          if (index < 5) {
                            const nextInput = (e.target as HTMLInputElement).parentElement?.children[index + 1] as HTMLInputElement;
                            nextInput?.focus();
                          }
                        }
                      }}
                      disabled={loading}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      data-testid={`otp-box-${index}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  (Master OTP for testing: 565656)
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            {step === 'input' ? (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                />
                <p className="text-sm text-muted-foreground">
                  Include country code (e.g., +91 for India)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="whatsapp-otp" className="text-base font-medium mb-3 block">Enter OTP Code</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Check WhatsApp. OTP sent to: <span className="font-medium text-foreground">{identifier}</span>
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[index] || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length === 1) {
                          setOtp(otp.substring(0, index) + value + otp.substring(index + 1));
                          if (index < 5) {
                            const nextInput = (e.target as HTMLInputElement).parentElement?.children[index + 1] as HTMLInputElement;
                            nextInput?.focus();
                          }
                        }
                      }}
                      disabled={loading}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      data-testid={`otp-box-whatsapp-${index}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  (Master OTP for testing: 565656)
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {message && (
          <Alert className={messageType === 'error' ? 'border-destructive' : messageType === 'success' ? 'border-green-500' : ''}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={messageType === 'success' ? 'text-green-600' : ''}>
              {message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {step === 'input' ? (
          <Button 
            onClick={sendOTP} 
            disabled={loading || !identifier.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              `Send OTP via ${activeTab === 'email' ? 'Email' : 'WhatsApp'}`
            )}
          </Button>
        ) : (
          <div className="w-full space-y-2">
            <Button 
              onClick={verifyOTP} 
              disabled={loading || otp.length !== 6}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
            
            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={resetForm}>
                Change {activeTab === 'email' ? 'Email' : 'Phone'}
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resendOTP}
                disabled={loading || resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}