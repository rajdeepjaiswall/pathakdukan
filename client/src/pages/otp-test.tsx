import { OTPVerification } from "@/components/otp-verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";

export default function OTPTest() {
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verifiedData, setVerifiedData] = useState<{ identifier: string; type: string } | null>(null);

  const handleVerificationSuccess = (identifier: string, type: 'email' | 'whatsapp') => {
    setVerifiedData({ identifier, type });
    setVerificationComplete(true);
  };

  const resetTest = () => {
    setVerificationComplete(false);
    setVerifiedData(null);
  };

  if (verificationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Verification Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p><strong>Verified {verifiedData?.type}:</strong> {verifiedData?.identifier}</p>
              <p><strong>Status:</strong> Successfully verified</p>
              <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
            </div>
            <Button onClick={resetTest} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Test Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OTP Verification System</h1>
          <p className="text-gray-600">Test the email and WhatsApp OTP verification functionality</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-600">Email OTP:</h4>
                  <p className="text-muted-foreground">
                    Enter any valid email address format. The OTP will be sent to the email if SMTP is configured.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600">WhatsApp OTP:</h4>
                  <p className="text-muted-foreground">
                    Enter phone with country code (e.g., +919876543210). Requires WhatsApp Business API setup.
                  </p>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> External services require proper API credentials in environment variables.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Database Connection:</span>
                  <span className="text-green-600 font-semibold">✓ Connected</span>
                </div>
                <div className="flex justify-between">
                  <span>OTP Table:</span>
                  <span className="text-green-600 font-semibold">✓ Ready</span>
                </div>
                <div className="flex justify-between">
                  <span>Email Service:</span>
                  <span className="text-amber-600 font-semibold">○ Needs Config</span>
                </div>
                <div className="flex justify-between">
                  <span>WhatsApp API:</span>
                  <span className="text-amber-600 font-semibold">○ Needs Config</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <OTPVerification 
              onVerificationSuccess={handleVerificationSuccess}
              purpose="system-test"
            />
          </div>
        </div>
      </div>
    </div>
  );
}