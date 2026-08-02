import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { register } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { GoogleLoginButton } from '@/components/ui/google-login-button';
import { MapPin, Loader2 } from 'lucide-react';
import newLogo from '@assets/Screenshot_2025-05-30-23-52-51-45_10a3d211b678d435d51c62b8010e86c1.jpg';
import MobileNav from '@/components/layout/mobile-nav';

export default function CustomerRegister() {
  const [, setLocation] = useLocation();
  const { login: authLogin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isFetchingPinData, setIsFetchingPinData] = useState(false);

  useEffect(() => {
    // Check URL parameters for Google auth success or errors
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get('google_auth');
    const error = urlParams.get('error');
    
    if (googleAuth === 'success') {
      checkAuthStatus();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error === 'google_not_configured') {
      toast({
        title: "Google Sign-up Not Available",
        description: "Google sign-up is not configured yet. Please use regular registration.",
        variant: "destructive",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated) {
          authLogin(data.user, 'session-based');
          setLocation('/');
          toast({
            title: "Welcome!",
            description: "Your account has been created successfully with Google.",
          });
        }
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
    }
  };
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    fullName: '',
    dateOfBirth: '',
    gender: '',
    addressLine1: '',
    addressLine2: '',
    area: '',
    city: '',
    state: '',
    pinCode: '',
    latitude: '',
    longitude: ''
  });

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get address from coordinates
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          setFormData(prev => ({
            ...prev,
            area: data.locality || '',
            city: data.city || data.locality || '',
            state: data.principalSubdivision || '',
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));

          toast({
            title: "Location found!",
            description: "Your current location has been added to the address field.",
          });
        } catch (error) {
          // Fallback to just coordinates if geocoding fails
          setFormData(prev => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));

          toast({
            title: "Location captured",
            description: "Your coordinates have been saved.",
          });
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Unable to get your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied. Please enable location permissions.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }

        toast({
          title: "Location error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const fetchLocationByPinCode = async (pinCode: string) => {
    if (!pinCode || pinCode.length !== 6) return;
    
    setIsFetchingPinData(true);
    
    try {
      // Using India Post Pin Code API for accurate data
      const response = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
      const data = await response.json();
      
      if (data[0].Status === "Success" && data[0].PostOffice.length > 0) {
        const locationData = data[0].PostOffice[0];
        
        setFormData(prev => ({
          ...prev,
          area: locationData.Name || '',
          city: locationData.District || '',
          state: locationData.State || ''
        }));

        toast({
          title: "Location details found",
          description: `Auto-filled details for ${locationData.District}, ${locationData.State}`,
        });
      } else {
        toast({
          title: "Pin code not found",
          description: "Please check the pin code and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error fetching location",
        description: "Unable to fetch location details. Please fill manually.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingPinData(false);
    }
  };

  const handlePinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pinCode = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData(prev => ({ ...prev, pinCode }));
    
    if (pinCode.length === 6) {
      fetchLocationByPinCode(pinCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!formData.email || !formData.phone || !formData.fullName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const registrationData = {
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        area: formData.area,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        role: 'customer'
      };
      
      const response = await register(registrationData);
      authLogin(response.user, response.token);
      setLocation('/');
      toast({
        title: "Account created successfully!",
        description: `Welcome to Pathak Bhandar, ${formData.fullName}!`,
      });
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-almond via-champagne/10 to-navy/5 p-4">
      <Card className="w-full max-w-lg shadow-xl border-champagne/20">
        <CardHeader className="text-center pb-6">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4">
            <img 
              src={newLogo}
              alt="Pathak Bhandar Logo" 
              className="w-12 h-12 object-contain"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-navy">Join Pathak Bhandar</CardTitle>
          <CardDescription className="text-navy/70">Create your account to start shopping for authentic sweets and snacks</CardDescription>
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
                <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  required
                />
              </div>
              <div>
                <Input
                  type="text"
                  placeholder="Username *"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  required
                />
              </div>
              <div>
                <Input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="password"
                  placeholder="Password *"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Confirm Password *"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  type="date"
                  placeholder="Date of Birth"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                />
              </div>
              <div>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-champagne/30 rounded-md focus:border-champagne focus:ring-champagne bg-white text-navy"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Address Fields Section */}
            <div className="border border-champagne/20 rounded-lg p-4 space-y-4 bg-almond/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">Address Information</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="h-8 w-8 p-0 text-champagne hover:text-navy hover:bg-champagne/10"
                  title="Get current location"
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Address Line 1"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine1: e.target.value }))}
                    className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={formData.addressLine2}
                    onChange={(e) => setFormData(prev => ({ ...prev, addressLine2: e.target.value }))}
                    className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Pin Code *"
                      value={formData.pinCode}
                      onChange={handlePinCodeChange}
                      className="border-champagne/30 focus:border-champagne focus:ring-champagne pr-8"
                      maxLength={6}
                    />
                    {isFetchingPinData && (
                      <Loader2 className="h-4 w-4 animate-spin absolute right-2 top-1/2 transform -translate-y-1/2 text-champagne" />
                    )}
                  </div>
                  <p className="text-xs text-navy/60 mt-1">Enter pin code to auto-fill location</p>
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="Area/Locality"
                    value={formData.area}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    type="text"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="State"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="border-champagne/30 focus:border-champagne focus:ring-champagne"
                  />
                </div>
              </div>
            </div>

            <div className="text-xs text-navy/60 bg-almond/30 p-3 rounded-md">
              <p className="mb-1">By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
              <p>Fields marked with * are required.</p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-champagne text-navy hover:bg-champagne/90 font-semibold py-3 shadow-lg transition-all duration-300" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating your account...' : 'Create Account'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-navy/70 mb-2">Already have an account?</p>
            <Button
              variant="link"
              onClick={() => setLocation('/login')}
              className="text-champagne hover:text-navy font-semibold"
            >
              Sign in to your account
            </Button>
          </div>
          </div>
        </CardContent>
      </Card>
      <MobileNav />
    </div>
  );
}