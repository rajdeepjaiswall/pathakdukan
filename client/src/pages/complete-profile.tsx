import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { GooglePlacesInput } from '@/components/ui/google-places-input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import MobileNav from '@/components/layout/mobile-nav';
import { ArrowLeft, Home, MapPin, Loader2, Phone, Lock, MapIcon } from 'lucide-react';

export default function CompleteProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, updateUser } = useAuth();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    confirmPassword: '',
    // Address fields
    name: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: 'Uttar Pradesh',
    pinCode: '',
    isDefault: true,
  });

  // Pre-fill user data from Google OAuth
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  // Auto-populate city/state from PIN code
  const handlePinCodeChange = async (pinCode: string) => {
    setFormData(prev => ({ ...prev, pinCode }));
    
    if (pinCode.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
        const data = await response.json();
        
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          setFormData(prev => ({
            ...prev,
            city: postOffice.District || prev.city,
            state: postOffice.State || prev.state,
          }));
          
          toast({
            title: "Location Found",
            description: `Updated city to ${postOffice.District}, ${postOffice.State}`,
          });
        }
      } catch (error) {
        console.error('Failed to fetch location data:', error);
      }
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support location services",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use reverse geocoding to get address
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          
          if (data.city && data.principalSubdivision) {
            setFormData(prev => ({
              ...prev,
              city: data.city,
              state: data.principalSubdivision,
              pinCode: data.postcode || prev.pinCode,
            }));
            
            toast({
              title: "Location Updated",
              description: `Updated to ${data.city}, ${data.principalSubdivision}`,
            });
          }
        } catch (error) {
          console.error('Failed to get location:', error);
          toast({
            title: "Location Error",
            description: "Failed to get your current location",
            variant: "destructive",
          });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location Access Denied",
          description: "Please allow location access or enter your address manually",
          variant: "destructive",
        });
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const completeProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create address and complete profile in one request
      const response = await fetch('/api/auth/complete-profile-with-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete profile');
      }
      
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast({
        title: "Profile Completed",
        description: "Your profile and address have been saved successfully!",
      });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    const requiredFields = [
      { field: 'phone', name: 'Phone number' },
      { field: 'password', name: 'Password' },
      { field: 'name', name: 'Full name' },
      { field: 'addressLine1', name: 'Address line 1' },
      { field: 'city', name: 'City' },
      { field: 'state', name: 'State' },
      { field: 'pinCode', name: 'PIN code' },
    ];

    const missingField = requiredFields.find(({ field }) => !formData[field as keyof typeof formData]);
    if (missingField) {
      toast({
        title: "Error",
        description: `Please fill in ${missingField.name}`,
        variant: "destructive",
      });
      return;
    }

    // Validate phone number (basic Indian format)
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast({
        title: "Error", 
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    // Validate PIN code
    if (!/^\d{6}$/.test(formData.pinCode)) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit PIN code",
        variant: "destructive",
      });
      return;
    }

    completeProfileMutation.mutate({
      // User profile data
      phone: formData.phone,
      password: formData.password,
      // Address data
      address: {
        name: formData.name,
        phone: formData.phone,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        landmark: formData.landmark,
        city: formData.city,
        state: formData.state,
        pincode: formData.pinCode,
        isDefault: formData.isDefault,
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSkipProfile = () => {
    skipProfileMutation.mutate();
  };

  const skipProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/skip-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to skip profile');
      }
      
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      toast({
        title: "Profile Skipped",
        description: "You can complete your profile later from the account page.",
      });
      navigate('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to skip profile",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
      {/* Navigation Header */}
      <div className="fixed top-4 left-4 z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          <Home className="h-4 w-4" />
          <span>Back to Store</span>
        </Button>
      </div>
      
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">Complete Your Profile</CardTitle>
            <CardDescription>
              Welcome {user?.firstName}! Please complete your profile to continue using Pathak Bhandar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="border border-orange-200 rounded-lg p-4 space-y-4 bg-orange-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="h-5 w-5 text-orange-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                  <p className="text-xs text-gray-600">This will be used for order updates and OTP verification</p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a secure password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Address Information Section */}
              <div className="border border-orange-200 rounded-lg p-4 space-y-4 bg-orange-50/30">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapIcon className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Delivery Address</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="h-8 px-3 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                    title="Get current location"
                  >
                    {isLoadingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MapPin className="h-4 w-4" />
                    )}
                    <span className="ml-1 text-xs">Auto-fill</span>
                  </Button>
                </div>

                {/* Address Line 1 */}
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">House/Building/Street *</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    placeholder="Enter house number, building, street"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Address Line 2 */}
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Area/Locality</Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    placeholder="Area, locality, sector (optional)"
                    value={formData.addressLine2}
                    onChange={handleChange}
                  />
                </div>

                {/* Landmark with Google Places */}
                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark</Label>
                  <GooglePlacesInput
                    value={formData.landmark}
                    onChange={(value, placeData) => {
                      setFormData(prev => ({ ...prev, landmark: value }));
                      // If place data is available, use it to update other fields
                      if (placeData?.postOffice) {
                        setFormData(prev => ({
                          ...prev,
                          landmark: value,
                          city: placeData.postOffice.District || prev.city,
                          state: placeData.postOffice.State || prev.state,
                        }));
                      }
                    }}
                    placeholder="Search nearby landmarks, shops, etc."
                    className="w-full"
                  />
                  <p className="text-xs text-gray-600">Help delivery partners find you easily</p>
                </div>

                {/* PIN Code with auto-population */}
                <div className="space-y-2">
                  <Label htmlFor="pinCode">PIN Code *</Label>
                  <Input
                    id="pinCode"
                    name="pinCode"
                    placeholder="Enter 6-digit PIN code"
                    value={formData.pinCode}
                    onChange={(e) => handlePinCodeChange(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-600">City and state will be auto-filled</p>
                </div>

                {/* City and State (auto-populated) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="State"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Set as Default */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, isDefault: !!checked }))
                    }
                  />
                  <Label htmlFor="isDefault" className="text-sm">
                    Set as default delivery address
                  </Label>
                </div>
              </div>

              {/* Submit and Skip buttons */}
              <div className="flex flex-col space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={completeProfileMutation.isPending}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
                >
                  {completeProfileMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Profile...
                    </div>
                  ) : (
                    'Complete Profile & Save Address'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkipProfile}
                  disabled={skipProfileMutation.isPending}
                  className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                >
                  {skipProfileMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Skipping...
                    </div>
                  ) : (
                    'Skip for now (can complete later)'
                  )}
                </Button>
              </div>
            </form>
            
            {/* Help text */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 text-center">
                <Lock className="h-3 w-3 inline mr-1" />
                Your information is secure and will only be used for order delivery
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <MobileNav />
    </div>
  );
}