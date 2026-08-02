import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { login } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { GoogleLoginButton } from '@/components/ui/google-login-button';
import MobileNav from '@/components/layout/mobile-nav';

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { login: authLogin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  useEffect(() => {
    // Check URL parameters for Google auth success or errors
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get('google_auth');
    const error = urlParams.get('error');
    
    if (googleAuth === 'success') {
      // Check if user is authenticated via session
      checkAuthStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error === 'google_not_configured') {
      toast({
        title: "Google Login Not Available",
        description: "Google login is not configured yet. Please use regular login.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error === 'mobile_webview') {
      toast({
        title: "Google Login Not Supported",
        description: "Google login doesn't work in mobile apps. Please open this site in your mobile browser (Chrome, Safari, etc.) to use Google login.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated) {
          authLogin(data.user, 'session-based'); // Use session-based auth for Google users
          setLocation('/');
          toast({
            title: "Welcome!",
            description: `Signed in successfully with Google.`,
          });
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login(formData);
      authLogin(response.user, response.token);
      setLocation('/');
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-orange-800">Welcome Back</CardTitle>
          <CardDescription>Sign in to your Pathak Bhandar account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Google Login Button */}
            <GoogleLoginButton disabled={isLoading} />
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Regular Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setLocation('/customer/register')}
                className="text-orange-600"
              >
                Don't have an account? Sign up
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <MobileNav />
    </div>
  );
}