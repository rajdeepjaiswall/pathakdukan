import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { User, MapPin, Phone, Mail, Edit3, Save, X, ArrowLeft, Store, Home } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNav from '@/components/layout/mobile-nav';
import CartSidebar from '@/components/cart/cart-sidebar';

const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

const addressSchema = z.object({
  addressLine1: z.string().min(5, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  area: z.string().min(2, 'Area is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pinCode: z.string().regex(/^\d{6}$/, 'Pin code must be 6 digits'),
});

type ProfileForm = z.infer<typeof profileSchema>;
type AddressForm = z.infer<typeof addressSchema>;

export default function CustomerProfile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressLine1: user?.address_line_1 || '',
      addressLine2: user?.address_line_2 || '',
      area: user?.area || '',
      city: user?.city || '',
      state: user?.state || '',
      pinCode: user?.pin_code || '',
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await apiRequest('PUT', '/api/auth/profile', data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setIsEditingProfile(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      const response = await apiRequest('PUT', '/api/auth/address', data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setIsEditingAddress(false);
      toast({
        title: 'Address updated',
        description: 'Your address has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update address',
        variant: 'destructive',
      });
    },
  });

  const handlePinCodeChange = async (pinCode: string) => {
    if (pinCode.length === 6) {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pinCode}`);
        const data = await response.json();
        
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const postOffice = data[0].PostOffice[0];
          addressForm.setValue('city', postOffice.District);
          addressForm.setValue('state', postOffice.State);
          addressForm.setValue('area', postOffice.Name);
        }
      } catch (error) {
        console.error('Failed to fetch location data:', error);
      }
    }
  };

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onAddressSubmit = (data: AddressForm) => {
    updateAddressMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Bar */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Go to Cart
            </Button>
          </Link>
        </div>
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Personal Information</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-navy" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                      className="border-champagne text-navy hover:bg-champagne/10"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingProfile ? (
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          {...profileForm.register('username')}
                          className="mt-1"
                        />
                        {profileForm.formState.errors.username && (
                          <p className="text-red-500 text-sm mt-1">
                            {profileForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          {...profileForm.register('phone')}
                          className="mt-1"
                        />
                        {profileForm.formState.errors.phone && (
                          <p className="text-red-500 text-sm mt-1">
                            {profileForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="email">Email Address (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          {...profileForm.register('email')}
                          className="mt-1"
                        />
                        {profileForm.formState.errors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {profileForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-champagne text-navy hover:bg-champagne/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingProfile(false)}
                        className="border-gray-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Username</Label>
                        <p className="text-navy font-medium">{user?.username || 'Not provided'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                        <p className="text-navy font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {user?.phone || 'Not provided'}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-500">Email Address</Label>
                        <p className="text-navy font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {user?.email || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-navy" />
                      Delivery Address
                    </CardTitle>
                    <CardDescription>
                      Manage your delivery address for orders
                    </CardDescription>
                  </div>
                  {!isEditingAddress && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingAddress(true)}
                      className="border-champagne text-navy hover:bg-champagne/10"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditingAddress ? (
                  <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          {...addressForm.register('addressLine1')}
                          placeholder="House/Flat number, Building name"
                          className="mt-1"
                        />
                        {addressForm.formState.errors.addressLine1 && (
                          <p className="text-red-500 text-sm mt-1">
                            {addressForm.formState.errors.addressLine1.message}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                        <Input
                          id="addressLine2"
                          {...addressForm.register('addressLine2')}
                          placeholder="Street name, Locality"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="pinCode">Pin Code</Label>
                        <Input
                          id="pinCode"
                          {...addressForm.register('pinCode', {
                            onChange: (e) => handlePinCodeChange(e.target.value)
                          })}
                          placeholder="6-digit pin code"
                          className="mt-1"
                        />
                        {addressForm.formState.errors.pinCode && (
                          <p className="text-red-500 text-sm mt-1">
                            {addressForm.formState.errors.pinCode.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="area">Area</Label>
                        <Input
                          id="area"
                          {...addressForm.register('area')}
                          className="mt-1"
                        />
                        {addressForm.formState.errors.area && (
                          <p className="text-red-500 text-sm mt-1">
                            {addressForm.formState.errors.area.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          {...addressForm.register('city')}
                          className="mt-1"
                        />
                        {addressForm.formState.errors.city && (
                          <p className="text-red-500 text-sm mt-1">
                            {addressForm.formState.errors.city.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          {...addressForm.register('state')}
                          className="mt-1"
                        />
                        {addressForm.formState.errors.state && (
                          <p className="text-red-500 text-sm mt-1">
                            {addressForm.formState.errors.state.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={updateAddressMutation.isPending}
                        className="bg-champagne text-navy hover:bg-champagne/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateAddressMutation.isPending ? 'Saving...' : 'Save Address'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditingAddress(false)}
                        className="border-gray-300"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {user?.address_line_1 ? (
                      <div className="p-4 bg-almond/20 rounded-lg">
                        <div className="space-y-2">
                          <p className="font-medium text-navy">{user.address_line_1}</p>
                          {user.address_line_2 && (
                            <p className="text-gray-600">{user.address_line_2}</p>
                          )}
                          <p className="text-gray-600">
                            {user.area}, {user.city}, {user.state} - {user.pin_code}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No address added yet</p>
                        <Button
                          onClick={() => setIsEditingAddress(true)}
                          className="mt-4 bg-champagne text-navy hover:bg-champagne/90"
                        >
                          Add Address
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}