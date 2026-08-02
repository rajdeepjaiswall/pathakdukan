import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle, Timer } from 'lucide-react';

export default function GoogleOneTapDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const simulateOneTap = () => {
    setShowDemo(true);
    
    // Simulate signing in process
    setTimeout(() => {
      setIsSigningIn(true);
    }, 1000);
    
    // Show completion
    setTimeout(() => {
      setIsSigningIn(false);
      setIsComplete(true);
    }, 2500);
    
    // Reset demo
    setTimeout(() => {
      setShowDemo(false);
      setIsComplete(false);
    }, 4000);
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Google One Tap Demo
          </CardTitle>
          <CardDescription>
            See how the automatic sign-in prompt works after browsing for 5-6 seconds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={simulateOneTap} className="w-full">
            Simulate One Tap Sign-In
          </Button>
          
          {showDemo && (
            <div className="relative">
              {/* Simulated One Tap Prompt */}
              <div className="border rounded-lg p-4 bg-white shadow-lg animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      G
                    </div>
                    <span className="text-sm font-medium">Sign in</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 text-sm">×</button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 rounded border hover:bg-gray-50 cursor-pointer">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      J
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">John Doe</div>
                      <div className="text-xs text-gray-500">john.doe@gmail.com</div>
                    </div>
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : isSigningIn ? (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                    ) : null}
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    {isComplete ? (
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Signed in successfully!
                      </Badge>
                    ) : isSigningIn ? (
                      <Badge variant="secondary">
                        <Timer className="h-3 w-3 mr-1 animate-spin" />
                        Signing in...
                      </Badge>
                    ) : (
                      "Choose an account to continue to Pathak Bhandar"
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>How it works:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Appears after 5-6 seconds of browsing</li>
              <li>Shows Google accounts already signed in</li>
              <li>One click to sign in without leaving page</li>
              <li>Cart contents are preserved</li>
              <li>No page reload required</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}