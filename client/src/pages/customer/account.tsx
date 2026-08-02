import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation, Link } from 'wouter';
import { 
  User, MapPin, Phone, Mail, Edit3, Save, X, Plus, Trash2, 
  AlertCircle, CheckCircle, Clock, Package, LogOut, Verified,
  ArrowLeft, Home, Store, ShieldAlert, Loader2
} from 'lucide-react';
import ProfileImageUpload from '@/components/ProfileImageUpload';
import MobileNav from '@/components/layout/mobile-nav';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Phone verification schema
const phoneVerificationSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  otp: z.string().min(6, 'OTP must be 6 digits').max(6, 'OTP must be 6 digits'),
});

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional().or(z.literal('')),
});

// Address schema
const addressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  addressLine1: z.string().min(5, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  landmark: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type PhoneVerificationForm = z.infer<typeof phoneVerificationSchema>;
type ProfileForm = z.infer<typeof profileSchema>;
type AddressForm = z.infer<typeof addressSchema>;

export default function CustomerAccount() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);

  // Delete account state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Change phone state
  const [phoneStep, setPhoneStep] = useState<'idle' | 'enter-otp'>('idle');
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [phoneOtpInput, setPhoneOtpInput] = useState('');
  const [phoneOtpResendIn, setPhoneOtpResendIn] = useState(0);
  const [phoneOtpEmailMask, setPhoneOtpEmailMask] = useState('');

  const requestPhoneOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/account/change-phone/request-otp', {
        new_phone: newPhoneInput.trim(),
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      setPhoneStep('enter-otp');
      setPhoneOtpEmailMask(data.email || '');
      setPhoneOtpResendIn(60);
      toast({
        title: data.delivered ? 'OTP sent' : 'OTP ready',
        description: data.message,
        variant: data.delivered ? 'default' : 'destructive',
      });
    },
    onError: (e: any) => {
      toast({
        title: 'Could not send OTP',
        description: e.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const confirmPhoneOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/account/change-phone/confirm', {
        new_phone: newPhoneInput.trim(),
        otp: phoneOtpInput.trim(),
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.user) updateUser(data.user);
      toast({
        title: 'Phone number updated',
        description: 'Your new phone number has been saved.',
      });
      setPhoneStep('idle');
      setNewPhoneInput('');
      setPhoneOtpInput('');
      setPhoneOtpEmailMask('');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
    },
    onError: (e: any) => {
      toast({
        title: 'Verification failed',
        description: e.message || 'Please check the OTP and try again.',
        variant: 'destructive',
      });
    },
  });

  // Resend cooldown ticker
  useEffect(() => {
    if (phoneOtpResendIn <= 0) return;
    const t = setTimeout(() => setPhoneOtpResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phoneOtpResendIn]);

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/delete-account', {
        reason: deleteReason.trim() || undefined,
        confirm: deleteConfirm.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account deleted',
        description: 'You can recover your account within 30 days through admin support.',
      });
      setDeleteOpen(false);
      setDeleteReason('');
      setDeleteConfirm('');
      // Log out and redirect home
      try { logout(); } catch {}
      setTimeout(() => setLocation('/'), 800);
    },
    onError: (e: any) => {
      toast({
        title: 'Could not delete account',
        description: e.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation('/customer/login');
      return;
    }
  }, [user, setLocation]);

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Forms
  const phoneForm = useForm<PhoneVerificationForm>({
    resolver: zodResolver(phoneVerificationSchema),
    defaultValues: {
      phone: user?.phone || '',
      otp: '',
    },
  });

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const addressForm = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      isDefault: false,
    },
  });

  // Queries
  const { data: addresses = [] } = useQuery({
    queryKey: ['/api/addresses'],
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['/api/orders/user'],
    enabled: !!user,
  });

  // Mutations
  const sendOtpMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest('POST', '/api/auth/send-phone-otp', { phone });
      return response.json();
    },
    onSuccess: () => {
      setOtpSent(true);
      setOtpTimer(60);
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    },
  });

  const verifyPhoneMutation = useMutation({
    mutationFn: async (data: PhoneVerificationForm) => {
      const response = await apiRequest('POST', '/api/auth/verify-phone', data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setOtpSent(false);
      phoneForm.reset();
      toast({
        title: 'Phone Verified',
        description: 'Your phone number has been verified successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP',
        variant: 'destructive',
      });
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
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    },
  });

  const addAddressMutation = useMutation({
    mutationFn: async (data: AddressForm) => {
      const response = await apiRequest('POST', '/api/addresses', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      setIsAddingAddress(false);
      addressForm.reset();
      toast({
        title: 'Address Added',
        description: 'Your address has been added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add address',
        variant: 'destructive',
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AddressForm }) => {
      const response = await apiRequest('PUT', `/api/addresses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      setEditingAddressId(null);
      toast({
        title: 'Address Updated',
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

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      toast({
        title: 'Address Deleted',
        description: 'Address has been removed from your account',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete address',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleSendOtp = () => {
    const phone = phoneForm.getValues('phone');
    if (phone) {
      sendOtpMutation.mutate(phone);
    }
  };

  const handleVerifyPhone = (data: PhoneVerificationForm) => {
    verifyPhoneMutation.mutate(data);
  };

  const handleUpdateProfile = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const handleAddAddress = (data: AddressForm) => {
    if (editingAddressId) {
      updateAddressMutation.mutate({ id: editingAddressId, data });
    } else {
      addAddressMutation.mutate(data);
    }
  };

  const handleEditAddress = (address: any) => {
    addressForm.reset(address);
    setEditingAddressId(address.id);
    setIsAddingAddress(true);
  };

  const handleDeleteAddress = (id: number) => {
    if (confirm('Are you sure you want to delete this address?')) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-almond">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setLocation('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <Store className="h-4 w-4" />
              <span>Back to Store</span>
            </Button>
            
            <h1 className="text-2xl font-bold text-navy">My Account</h1>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4 max-w-4xl">
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
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ProfileImageUpload 
              currentImageUrl={(user as any)?.profileImageUrl} 
              userName={(user as any)?.firstName || user?.username || 'User'}
              size="lg"
            />
            <div>
              <h2 className="text-xl font-bold">Account Dashboard</h2>
              <p className="text-muted-foreground">
                Welcome back, {(user as any)?.firstName || user?.username}!
              </p>
            </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses" className="relative">
            Addresses
            {addresses.length === 0 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Profile Information
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  {isEditingProfile ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">First Name</Label>
                      <p className="text-lg">{(user as any).firstName || 'Not set'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Name</Label>
                      <p className="text-lg">{(user as any).lastName || 'Not set'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-lg flex items-center gap-2">
                      {user.email || 'Not set'}
                      {user.email && <CheckCircle className="w-4 h-4 text-green-500" />}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-lg flex items-center gap-2">
                      {user.phone || 'Not set'}
                      {user.phone && (user as any).isVerified ? (
                        <Badge variant="secondary" className="text-green-600">
                          <Verified className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : user.phone ? (
                        <Badge variant="destructive">Not Verified</Badge>
                      ) : null}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Type</Label>
                    <p className="text-lg">
                      <Badge variant="outline">{(user as any).authProvider === 'google' ? 'Google Account' : 'Regular Account'}</Badge>
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={profileForm.handleSubmit(handleUpdateProfile)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        {...profileForm.register('firstName')}
                        error={profileForm.formState.errors.firstName?.message}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        {...profileForm.register('lastName')}
                        error={profileForm.formState.errors.lastName?.message}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="10-digit mobile number"
                      {...profileForm.register('phone')}
                      error={profileForm.formState.errors.phone?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...profileForm.register('email')}
                      error={profileForm.formState.errors.email?.message}
                      disabled={(user as any).authProvider === 'google'}
                    />
                    {(user as any).authProvider === 'google' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Email cannot be changed for Google accounts
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Change Phone Number — verified via OTP sent to registered email */}
          <Card className="mt-6 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Change Phone Number
              </CardTitle>
              <CardDescription>
                For your safety, we will send a 6-digit code to your registered email
                {user.email ? <> (<span className="font-medium">{user.email}</span>)</> : ''}.
                Enter the code to confirm the new number.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!user.email ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No email is linked to your account. Please add an email above before changing your phone number.
                  </AlertDescription>
                </Alert>
              ) : phoneStep === 'idle' ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="new-phone">New phone number</Label>
                    <Input
                      id="new-phone"
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={newPhoneInput}
                      onChange={(e) => setNewPhoneInput(e.target.value.replace(/\D/g, ''))}
                      data-testid="input-new-phone"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current: <span className="font-medium">{user.phone || 'Not set'}</span>
                    </p>
                  </div>
                  <Button
                    onClick={() => requestPhoneOtpMutation.mutate()}
                    disabled={
                      !/^[6-9]\d{9}$/.test(newPhoneInput) ||
                      newPhoneInput === user.phone ||
                      requestPhoneOtpMutation.isPending
                    }
                    data-testid="button-send-phone-otp"
                  >
                    {requestPhoneOtpMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</>
                    ) : (
                      <><Mail className="w-4 h-4 mr-2" /> Send OTP to Email</>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      We sent a 6-digit code to <span className="font-medium">{phoneOtpEmailMask || user.email}</span>.
                      It expires in 5 minutes.
                    </AlertDescription>
                  </Alert>
                  <div>
                    <Label htmlFor="phone-otp">Enter 6-digit OTP</Label>
                    <Input
                      id="phone-otp"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="••••••"
                      value={phoneOtpInput}
                      onChange={(e) => setPhoneOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="tracking-[0.5em] text-center text-lg font-semibold"
                      data-testid="input-phone-otp"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Updating phone to: <span className="font-medium">{newPhoneInput}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => confirmPhoneOtpMutation.mutate()}
                      disabled={phoneOtpInput.length !== 6 || confirmPhoneOtpMutation.isPending}
                      data-testid="button-verify-phone-otp"
                    >
                      {confirmPhoneOtpMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
                      ) : (
                        <><CheckCircle className="w-4 h-4 mr-2" /> Verify &amp; Update</>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => requestPhoneOtpMutation.mutate()}
                      disabled={phoneOtpResendIn > 0 || requestPhoneOtpMutation.isPending}
                      data-testid="button-resend-phone-otp"
                    >
                      {phoneOtpResendIn > 0 ? `Resend in ${phoneOtpResendIn}s` : 'Resend OTP'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setPhoneStep('idle');
                        setPhoneOtpInput('');
                        setPhoneOtpEmailMask('');
                      }}
                      data-testid="button-cancel-phone-change"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Saved Addresses
                <Button onClick={() => setIsAddingAddress(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </CardTitle>
              <CardDescription>
                Manage your delivery addresses for faster checkout
              </CardDescription>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No addresses saved yet. Add your first address to speed up checkout.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address: any) => (
                    <Card key={address.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{address.name}</h4>
                            {address.isDefault && <Badge>Default</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <Phone className="w-3 h-3 inline mr-1" />
                            {address.phone}
                          </p>
                          <p className="text-sm">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                            {address.city}, {address.state} - {address.pincode}
                          </p>
                          {address.landmark && (
                            <p className="text-xs text-muted-foreground">
                              Near: {address.landmark}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add/Edit Address Form */}
              {isAddingAddress && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>
                      {editingAddressId ? 'Edit Address' : 'Add New Address'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={addressForm.handleSubmit(handleAddAddress)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            {...addressForm.register('name')}
                            error={addressForm.formState.errors.name?.message}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            {...addressForm.register('phone')}
                            error={addressForm.formState.errors.phone?.message}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input
                          id="addressLine1"
                          {...addressForm.register('addressLine1')}
                          placeholder="House/Flat number, Building name"
                          error={addressForm.formState.errors.addressLine1?.message}
                        />
                      </div>
                      <div>
                        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                        <Input
                          id="addressLine2"
                          {...addressForm.register('addressLine2')}
                          placeholder="Area, Street, Sector"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            {...addressForm.register('city')}
                            error={addressForm.formState.errors.city?.message}
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            {...addressForm.register('state')}
                            error={addressForm.formState.errors.state?.message}
                          />
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            {...addressForm.register('pincode')}
                            error={addressForm.formState.errors.pincode?.message}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="landmark">Landmark (Optional)</Label>
                        <Input
                          id="landmark"
                          {...addressForm.register('landmark')}
                          placeholder="Near temple, hospital, etc."
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isDefault"
                          {...addressForm.register('isDefault')}
                          className="rounded"
                        />
                        <Label htmlFor="isDefault">Make this my default address</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={addAddressMutation.isPending || updateAddressMutation.isPending}>
                          <Save className="w-4 h-4 mr-2" />
                          {editingAddressId ? 'Update Address' : 'Save Address'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsAddingAddress(false);
                            setEditingAddressId(null);
                            addressForm.reset();
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
              <CardDescription>
                Track your past orders and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    No orders yet. Start shopping to see your orders here!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {orders.map((order: any) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">Order #{order.orderNumber}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.orderDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'cancelled' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <p className="text-sm font-medium">₹{parseFloat(order.total).toFixed(2)}</p>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <div className="text-sm text-muted-foreground">
                        <p>{order.deliveryAddress.name}, {order.deliveryAddress.phone}</p>
                        <p>{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Phone Verification</CardTitle>
              <CardDescription>
                Verify your phone number for order updates and security
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.phone && user.isVerified ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your phone number {user.phone} is verified and secure.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={phoneForm.handleSubmit(handleVerifyPhone)} className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        {...phoneForm.register('phone')}
                        placeholder="Enter 10-digit mobile number"
                        error={phoneForm.formState.errors.phone?.message}
                        disabled={otpSent}
                      />
                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendOtpMutation.isPending || otpSent}
                      >
                        {otpSent ? `Resend (${otpTimer}s)` : 'Send OTP'}
                      </Button>
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        {...phoneForm.register('otp')}
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        error={phoneForm.formState.errors.otp?.message}
                      />
                      <Button 
                        type="submit" 
                        className="mt-2"
                        disabled={verifyPhoneMutation.isPending}
                      >
                        Verify Phone
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="w-5 h-5" /> Delete My Account
              </CardTitle>
              <CardDescription>
                Permanently close your account. You will have 30 days to recover it through admin support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="border-red-300 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  Deleting your account will log you out and disable login. Your data will be kept securely for 30 days
                  in case you change your mind. After 30 days, it will be permanently removed.
                </AlertDescription>
              </Alert>
              <Button
                variant="destructive"
                className="mt-4"
                onClick={() => setDeleteOpen(true)}
                data-testid="button-open-delete-account"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (deleteAccountMutation.isPending) return;
          setDeleteOpen(o);
          if (!o) {
            setDeleteReason('');
            setDeleteConfirm('');
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <ShieldAlert className="w-5 h-5" /> Delete My Account
            </DialogTitle>
            <DialogDescription className="text-red-700 font-medium">
              Your account will be deleted. Your data can be recovered within 30 days through admin support.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="delete-reason">Please tell us why you are leaving (optional)</Label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value.slice(0, 1000))}
                placeholder="Your feedback helps us improve…"
                rows={3}
                className="mt-1"
                data-testid="input-delete-reason"
              />
            </div>
            <div>
              <Label htmlFor="delete-confirm">
                Type <span className="font-bold text-red-700">pathak</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="pathak"
                className="mt-1"
                autoComplete="off"
                data-testid="input-delete-confirm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteAccountMutation.isPending}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAccountMutation.mutate()}
              disabled={
                deleteAccountMutation.isPending ||
                deleteConfirm.trim().toLowerCase() !== 'pathak'
              }
              data-testid="button-confirm-delete"
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}