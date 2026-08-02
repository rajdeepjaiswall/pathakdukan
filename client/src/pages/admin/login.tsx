import { useState, useRef, useEffect } from 'react';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { login } from '@/lib/auth';
import logoSrc from '@assets/Screenshot_2026-04-27-10-24-05-83_40deb401b9ffe8e1df2f1cc5ba48_1777357998810.jpg';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsLoading(true);

    try {
      const response = await login({ username, password });

      if (
        response.user.role !== 'admin' &&
        response.user.role !== 'sub_admin' &&
        response.user.role !== 'super_admin'
      ) {
        throw new Error('Unauthorized access — admin privileges required');
      }

      toast({
        title: 'Welcome back',
        description: 'Successfully logged in.',
      });

      const target =
        response.user.role === 'super_admin' ? '/super-admin' : '/admin';
      window.location.href = target;
    } catch (error: any) {
      submittingRef.current = false;
      setIsLoading(false);
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf6ee] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="bg-white shadow-xl rounded-2xl border border-[#efe3d2]">
          <CardHeader className="text-center pb-4 pt-8">
            <div
              className="mx-auto mb-5 w-20 h-20 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5 bg-white flex items-center justify-center"
              data-testid="img-logo-container"
            >
              <img
                src={logoSrc}
                alt="Pathak Bhandar"
                className="w-full h-full object-cover"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-navy">
              Admin Dashboard
            </CardTitle>
            <p className="text-xs text-[#8a6d4a] mt-1">
              For internal use only — no trespassing allowed
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="on">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-navy font-medium">
                  Username
                </Label>
                <Input
                  ref={usernameInputRef}
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="rounded-xl border-gray-200 focus:ring-champagne focus:border-champagne h-11"
                  autoComplete="username"
                  required
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-navy font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl border-gray-200 focus:ring-champagne focus:border-champagne pr-10 h-11"
                    autoComplete="current-password"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword((v) => !v)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-champagne text-navy hover:bg-champagne/90 font-semibold py-3 rounded-xl h-11"
                data-testid="button-submit"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In to Dashboard
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Need higher privileges?</p>
              <button
                type="button"
                onClick={() => (window.location.href = '/super-admin/login')}
                className="text-sm font-medium text-[#8a6d4a] hover:text-navy transition-colors"
                data-testid="link-super-admin-login"
              >
                Super Admin Login →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
