import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Save, X, Upload, Video, Image, ChevronDown, ChevronRight, Megaphone, Eye, EyeOff, MousePointerClick } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import VideoUploader from '@/components/VideoUploader';
import type { PopupBanner } from '@shared/schema';

interface Banner {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  displayOrder: number;
  placement?: string | null;
}

const PLACEMENTS: { value: string; label: string; description: string }[] = [
  { value: 'hero', label: 'Hero Banner', description: 'Top of homepage — main carousel' },
  { value: 'after_featured', label: 'After Featured Products', description: 'Below the featured products section' },
  { value: 'after_trending', label: 'After Trending', description: 'Below the trending section' },
  { value: 'after_trending_mini', label: 'Trending — Mini Carousel', description: 'Compact carousel under Trending Local with title and description overlay' },
  { value: 'after_zero_products', label: 'After Zero Products', description: 'Below the deal of the day' },
  { value: 'after_chef_editorial', label: 'After Chef Editorial', description: 'Below the chef editorial section' },
];

const placementLabel = (value: string | null | undefined) => {
  const p = PLACEMENTS.find((x) => x.value === (value || 'hero'));
  return p?.label || 'Hero Banner';
};

export default function AdminBanners() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createPlacement, setCreatePlacement] = useState<string>('hero');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [newBanner, setNewBanner] = useState({
    title: '',
    description: '',
    imageUrl: '',
    videoUrl: '',
    linkUrl: '',
    isActive: true,
    displayOrder: 1,
    placement: 'hero',
  });
  const [bannerType, setBannerType] = useState<'image' | 'video'>('image');

  // Popup ad state
  const [isPopupDialogOpen, setIsPopupDialogOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<PopupBanner | null>(null);
  const [popupForm, setPopupForm] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    triggerType: 'page_load' as 'page_load' | 'login',
    showOnce: true,
    isActive: true,
  });

  // Redirect if not admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5EFE6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6B3E2E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  // Fetch banners
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['/api/banners'],
  });

  // Create banner mutation
  const createBannerMutation = useMutation({
    mutationFn: async (bannerData: any) => {
      const response = await apiRequest('POST', '/api/admin/banners', bannerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'], refetchType: 'all' });
      setIsCreating(false);
      setNewBanner({
        title: '',
        description: '',
        imageUrl: '',
        videoUrl: '',
        linkUrl: '',
        isActive: true,
        displayOrder: 1,
        placement: createPlacement,
      });
      setBannerType('image');
      toast({
        title: 'Banner created',
        description: 'The new banner has been created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error creating banner',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const friendlyAuthError = (error: any) => {
    const msg = error?.message || '';
    if (msg.startsWith('401')) {
      return 'Your admin session has expired. Please log in again.';
    }
    if (msg.startsWith('403')) {
      return 'You do not have permission to do this.';
    }
    return msg || 'Something went wrong. Please try again.';
  };

  // Update banner mutation
  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, ...bannerData }: any) => {
      const response = await apiRequest('PATCH', `/api/admin/banners/${id}`, bannerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'], refetchType: 'all' });
      setEditingBanner(null);
      toast({
        title: 'Banner updated',
        description: 'The banner has been updated successfully',
      });
    },
    onError: (error: any) => {
      const description = friendlyAuthError(error);
      toast({
        title: 'Error updating banner',
        description,
        variant: 'destructive',
      });
      if ((error?.message || '').startsWith('401')) {
        setTimeout(() => setLocation('/admin/login'), 1500);
      }
    },
  });

  // Toggle active mutation (inline switch — does not exit edit/view mode)
  // Optimistic update: switch moves immediately, reverts only on real error.
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/banners/${id}`, { isActive });
      const text = await response.text();
      return text ? JSON.parse(text) : null;
    },
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/banners'] });
      const previous = queryClient.getQueryData<Banner[]>(['/api/banners']);
      if (previous) {
        queryClient.setQueryData<Banner[]>(
          ['/api/banners'],
          previous.map((b) => (b.id === id ? { ...b, isActive } : b)),
        );
      }
      return { previous };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'], refetchType: 'all' });
      toast({
        title: variables.isActive ? 'Banner turned ON' : 'Banner turned OFF',
        description: variables.isActive
          ? 'This banner is now visible on the homepage.'
          : 'This banner is now hidden from the homepage.',
      });
    },
    onError: (error: any, _variables, context) => {
      // Roll back to the snapshot we took in onMutate
      if (context?.previous) {
        queryClient.setQueryData(['/api/banners'], context.previous);
      }
      const description = friendlyAuthError(error);
      toast({
        title: 'Could not update banner',
        description,
        variant: 'destructive',
      });
      if ((error?.message || '').startsWith('401')) {
        setTimeout(() => setLocation('/admin/login'), 1500);
      }
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/banners/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/banners'], refetchType: 'all' });
      setEditingBanner(null);
      toast({
        title: 'Banner deleted',
        description: 'The banner has been deleted successfully',
      });
    },
    onError: (error: any) => {
      const description = friendlyAuthError(error);
      toast({
        title: 'Error deleting banner',
        description,
        variant: 'destructive',
      });
      if ((error?.message || '').startsWith('401')) {
        setTimeout(() => setLocation('/admin/login'), 1500);
      }
    },
  });

  const [deleteConfirmBanner, setDeleteConfirmBanner] = useState<Banner | null>(null);

  const handleDeleteBanner = (banner: Banner) => {
    setDeleteConfirmBanner(banner);
  };

  const confirmDeleteBanner = () => {
    if (deleteConfirmBanner) {
      deleteBannerMutation.mutate(deleteConfirmBanner.id);
      setDeleteConfirmBanner(null);
    }
  };

  // ===== Popup ad mutations =====
  const { data: popupBanners = [] } = useQuery<PopupBanner[]>({
    queryKey: ['/api/admin/popup-banners'],
  });

  const resetPopupForm = () => {
    setPopupForm({
      title: '',
      imageUrl: '',
      linkUrl: '',
      triggerType: 'page_load',
      showOnce: true,
      isActive: true,
    });
    setEditingPopup(null);
  };

  const openCreatePopupDialog = () => {
    resetPopupForm();
    setIsPopupDialogOpen(true);
  };

  const openEditPopupDialog = (popup: PopupBanner) => {
    setEditingPopup(popup);
    setPopupForm({
      title: popup.title || '',
      imageUrl: popup.imageUrl || '',
      linkUrl: popup.linkUrl || '',
      triggerType: (popup.triggerType as 'page_load' | 'login') || 'page_load',
      showOnce: popup.showOnce ?? true,
      isActive: popup.isActive ?? true,
    });
    setIsPopupDialogOpen(true);
  };

  const handlePopupImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      setPopupForm((prev) => ({ ...prev, imageUrl: (event.target?.result as string) || '' }));
    };
    reader.readAsDataURL(file);
  };

  const createPopupMutation = useMutation({
    mutationFn: async (data: typeof popupForm) => {
      const res = await apiRequest('POST', '/api/admin/popup-banners', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/popup-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/popup-banners/active'] });
      setIsPopupDialogOpen(false);
      resetPopupForm();
      toast({ title: 'Popup ad created', description: 'Your popup ad is live now.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Could not create popup ad',
        description: friendlyAuthError(error),
        variant: 'destructive',
      });
      if ((error?.message || '').startsWith('401')) {
        setTimeout(() => setLocation('/admin/login'), 1500);
      }
    },
  });

  const updatePopupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof popupForm> }) => {
      const res = await apiRequest('PATCH', `/api/admin/popup-banners/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/popup-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/popup-banners/active'] });
      setIsPopupDialogOpen(false);
      resetPopupForm();
      toast({ title: 'Popup ad updated' });
    },
    onError: (error: any) => {
      toast({
        title: 'Could not update popup ad',
        description: friendlyAuthError(error),
        variant: 'destructive',
      });
      if ((error?.message || '').startsWith('401')) {
        setTimeout(() => setLocation('/admin/login'), 1500);
      }
    },
  });

  const togglePopupActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest('PATCH', `/api/admin/popup-banners/${id}`, { isActive });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/popup-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/popup-banners/active'] });
      toast({
        title: variables.isActive ? 'Popup ad turned ON' : 'Popup ad turned OFF',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Could not update popup ad',
        description: friendlyAuthError(error),
        variant: 'destructive',
      });
    },
  });

  const deletePopupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/popup-banners/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/popup-banners'] });
      queryClient.invalidateQueries({ queryKey: ['/api/popup-banners/active'] });
      toast({ title: 'Popup ad deleted' });
    },
    onError: (error: any) => {
      toast({
        title: 'Could not delete popup ad',
        description: friendlyAuthError(error),
        variant: 'destructive',
      });
    },
  });

  const handleSavePopup = () => {
    if (!popupForm.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please give the popup ad a title.',
        variant: 'destructive',
      });
      return;
    }
    if (!popupForm.imageUrl) {
      toast({
        title: 'Image required',
        description: 'Please upload an image for the popup ad.',
        variant: 'destructive',
      });
      return;
    }
    if (editingPopup) {
      updatePopupMutation.mutate({ id: editingPopup.id, data: popupForm });
    } else {
      createPopupMutation.mutate(popupForm);
    }
  };

  const [deleteConfirmPopup, setDeleteConfirmPopup] = useState<PopupBanner | null>(null);

  const handleDeletePopup = (popup: PopupBanner) => {
    setDeleteConfirmPopup(popup);
  };

  const confirmDeletePopup = () => {
    if (deleteConfirmPopup) {
      deletePopupMutation.mutate(deleteConfirmPopup.id);
      setDeleteConfirmPopup(null);
    }
  };

  const handleImageUpload = (file: File, isNew = false) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      if (isNew) {
        setNewBanner((prev) => ({ ...prev, imageUrl, videoUrl: '' }));
      } else if (editingBanner) {
        setEditingBanner((prev) => (prev ? { ...prev, imageUrl, videoUrl: '' } : null));
      }
      toast({
        title: 'Image uploaded',
        description: 'Banner image has been uploaded successfully',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateBanner = () => {
    if (!newBanner.title.trim() || !newBanner.description.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please fill in the title and description',
        variant: 'destructive',
      });
      return;
    }

    if (!newBanner.imageUrl && !newBanner.videoUrl) {
      toast({
        title: 'Missing content',
        description: 'Please add either an image or video for the banner',
        variant: 'destructive',
      });
      return;
    }

    createBannerMutation.mutate(newBanner);
  };

  const handleUpdateBanner = () => {
    if (!editingBanner) return;
    updateBannerMutation.mutate(editingBanner);
  };

  const startCreating = (placement: string) => {
    setCreatePlacement(placement);
    setNewBanner({
      title: '',
      description: '',
      imageUrl: '',
      videoUrl: '',
      linkUrl: '',
      isActive: true,
      displayOrder: 1,
      placement,
    });
    setBannerType('image');
    setIsCreating(true);
  };

  const toggleGroup = (placement: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [placement]: !prev[placement] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group banners by placement
  const allBanners = banners as Banner[];
  const grouped: Record<string, Banner[]> = {};
  PLACEMENTS.forEach((p) => {
    grouped[p.value] = [];
  });
  allBanners.forEach((b) => {
    const key = b.placement || 'hero';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(b);
  });
  Object.values(grouped).forEach((arr) => arr.sort((a, b) => a.displayOrder - b.displayOrder));

  const renderBannerCard = (banner: Banner) => (
    <Card key={banner.id}>
      <CardContent className="p-6">
        {editingBanner?.id === banner.id ? (
          // Edit mode
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`title-${banner.id}`}>Title</Label>
                <Input
                  id={`title-${banner.id}`}
                  value={editingBanner.title}
                  onChange={(e) =>
                    setEditingBanner((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                />
              </div>
              <div>
                <Label htmlFor={`link-${banner.id}`}>Link URL</Label>
                <Input
                  id={`link-${banner.id}`}
                  value={editingBanner.linkUrl || ''}
                  onChange={(e) =>
                    setEditingBanner((prev) => (prev ? { ...prev, linkUrl: e.target.value } : null))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`desc-${banner.id}`}>Description</Label>
              <Textarea
                id={`desc-${banner.id}`}
                value={editingBanner.description}
                onChange={(e) =>
                  setEditingBanner((prev) => (prev ? { ...prev, description: e.target.value } : null))
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor={`placement-${banner.id}`}>Placement</Label>
              <Select
                value={editingBanner.placement || 'hero'}
                onValueChange={(value) =>
                  setEditingBanner((prev) => (prev ? { ...prev, placement: value } : null))
                }
              >
                <SelectTrigger id={`placement-${banner.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Banner Image</Label>
              <div className="mt-2">
                {editingBanner.imageUrl ? (
                  <div className="relative">
                    <img
                      src={editingBanner.imageUrl}
                      alt="Banner"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-white"
                      onClick={() =>
                        setEditingBanner((prev) => (prev ? { ...prev, imageUrl: '' } : null))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label htmlFor={`image-${banner.id}`} className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-champagne">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Click to upload new image</span>
                    </div>
                    <Input
                      id={`image-${banner.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file, false);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id={`active-${banner.id}`}
                  checked={editingBanner.isActive}
                  onCheckedChange={(checked) =>
                    setEditingBanner((prev) => (prev ? { ...prev, isActive: checked } : null))
                  }
                />
                <Label htmlFor={`active-${banner.id}`}>Active</Label>
              </div>
              <div>
                <Label htmlFor={`order-${banner.id}`}>Display Order</Label>
                <Input
                  id={`order-${banner.id}`}
                  type="number"
                  value={editingBanner.displayOrder}
                  onChange={(e) =>
                    setEditingBanner((prev) =>
                      prev ? { ...prev, displayOrder: parseInt(e.target.value) || 1 } : null,
                    )
                  }
                  className="w-20"
                  min="1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateBanner}
                disabled={updateBannerMutation.isPending}
                className="bg-champagne text-navy hover:bg-champagne/80"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditingBanner(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // View mode
          <div className="flex gap-6">
            {banner.imageUrl && (
              <img
                src={banner.imageUrl}
                alt={banner.title}
                className="w-48 h-32 object-cover rounded-lg"
              />
            )}
            {banner.videoUrl && (
              <div className="w-48 h-32 rounded-lg overflow-hidden">
                <video
                  src={banner.videoUrl}
                  className="w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                <h3 className="text-xl font-bold text-navy">{banner.title}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
                    <Switch
                      id={`toggle-active-${banner.id}`}
                      checked={banner.isActive}
                      disabled={
                        toggleActiveMutation.isPending &&
                        toggleActiveMutation.variables?.id === banner.id
                      }
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: banner.id, isActive: checked })
                      }
                    />
                    <Label
                      htmlFor={`toggle-active-${banner.id}`}
                      className={`text-xs font-semibold cursor-pointer ${
                        banner.isActive ? 'text-green-700' : 'text-gray-500'
                      }`}
                    >
                      {banner.isActive ? 'ON' : 'OFF'}
                    </Label>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setEditingBanner(banner)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                    onClick={() => handleDeleteBanner(banner)}
                    disabled={deleteBannerMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-gray-600 mb-2">{banner.description}</p>
              {banner.linkUrl && (
                <p className="text-sm text-champagne mb-2">
                  Link:{' '}
                  <a
                    href={banner.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {banner.linkUrl}
                  </a>
                </p>
              )}
              <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
                <span>Order: {banner.displayOrder}</span>
                <span>Placement: {placementLabel(banner.placement)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Banner Management</h1>
            <p className="text-gray-600">
              Manage the hero carousel and modular banner blocks across the homepage
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-champagne text-navy hover:bg-champagne/80">
                <Plus className="h-4 w-4 mr-2" />
                Add Banner
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem
                onClick={() => startCreating('hero')}
                className="cursor-pointer py-3"
              >
                <Image className="h-4 w-4 mr-3 text-navy" />
                <div>
                  <div className="font-semibold text-navy">Banner Block</div>
                  <div className="text-xs text-gray-500">
                    Hero carousel or in-page section banner
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={openCreatePopupDialog}
                className="cursor-pointer py-3"
              >
                <Megaphone className="h-4 w-4 mr-3 text-navy" />
                <div>
                  <div className="font-semibold text-navy">Popup Ad</div>
                  <div className="text-xs text-gray-500">
                    Dismissible popup shown to customers
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Create Banner Form */}
        {isCreating && (
          <Card className="mb-8 border-2 border-champagne">
            <CardHeader>
              <CardTitle>
                Create New Banner — {placementLabel(newBanner.placement)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-placement">Placement</Label>
                <Select
                  value={newBanner.placement}
                  onValueChange={(value) =>
                    setNewBanner((prev) => ({ ...prev, placement: value }))
                  }
                >
                  <SelectTrigger id="new-placement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label} — {p.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-title">Title</Label>
                  <Input
                    id="new-title"
                    value={newBanner.title}
                    onChange={(e) =>
                      setNewBanner((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Banner title"
                  />
                </div>
                <div>
                  <Label htmlFor="new-link">Link URL (optional)</Label>
                  <Input
                    id="new-link"
                    value={newBanner.linkUrl}
                    onChange={(e) =>
                      setNewBanner((prev) => ({ ...prev, linkUrl: e.target.value }))
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newBanner.description}
                  onChange={(e) =>
                    setNewBanner((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Banner description"
                  rows={3}
                />
              </div>
              {/* Banner Type Selection */}
              <div className="space-y-3">
                <Label>Banner Content</Label>
                <Tabs
                  value={bannerType}
                  onValueChange={(value) => setBannerType(value as 'image' | 'video')}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Image Banner
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video Banner
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="image" className="mt-4">
                    <div className="space-y-3">
                      <div>
                        {newBanner.imageUrl ? (
                          <div className="relative">
                            <img
                              src={newBanner.imageUrl}
                              alt="Banner preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="absolute top-2 right-2 bg-white"
                              onClick={() =>
                                setNewBanner((prev) => ({ ...prev, imageUrl: '' }))
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label htmlFor="new-image-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-champagne">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Click to upload banner image
                              </span>
                            </div>
                            <Input
                              id="new-image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, true);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="mt-4">
                    <div className="space-y-3">
                      <VideoUploader
                        value={newBanner.videoUrl}
                        onChange={(url) =>
                          setNewBanner((prev) => ({ ...prev, videoUrl: url, imageUrl: '' }))
                        }
                        onRemove={() => setNewBanner((prev) => ({ ...prev, videoUrl: '' }))}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="new-active"
                    checked={newBanner.isActive}
                    onCheckedChange={(checked) =>
                      setNewBanner((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                  <Label htmlFor="new-active">Active</Label>
                </div>
                <div>
                  <Label htmlFor="new-order">Display Order</Label>
                  <Input
                    id="new-order"
                    type="number"
                    value={newBanner.displayOrder}
                    onChange={(e) =>
                      setNewBanner((prev) => ({
                        ...prev,
                        displayOrder: parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-20"
                    min="1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateBanner}
                  disabled={createBannerMutation.isPending}
                  className="bg-champagne text-navy hover:bg-champagne/80"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Create Banner
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grouped Banner Blocks */}
        <div className="space-y-8">
          {PLACEMENTS.map((p) => {
            const items = grouped[p.value] || [];
            const collapsed = collapsedGroups[p.value];
            const isHero = p.value === 'hero';
            return (
              <div
                key={p.value}
                className={`rounded-xl border-2 ${
                  isHero ? 'border-champagne bg-champagne/5' : 'border-gray-200 bg-white/40'
                } p-4 md:p-6`}
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => toggleGroup(p.value)}
                    className="flex items-center gap-2 text-left"
                  >
                    {collapsed ? (
                      <ChevronRight className="h-5 w-5 text-navy" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-navy" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-navy">{p.label}</h2>
                        <Badge variant="secondary" className="bg-navy text-white">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{p.description}</p>
                    </div>
                  </button>
                  <Button
                    onClick={() => startCreating(p.value)}
                    variant="outline"
                    size="sm"
                    className="border-champagne text-navy hover:bg-champagne/20"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to {p.label}
                  </Button>
                </div>

                {!collapsed && (
                  <div className="space-y-4">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                        No banners in this block yet
                      </div>
                    ) : (
                      items.map((banner) => renderBannerCard(banner))
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* ===== Popup Ads section ===== */}
          <div className="border-2 border-gray-200 rounded-xl p-4 bg-white mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Megaphone className="h-6 w-6 text-navy" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-navy">Popup Ads</h2>
                    <Badge variant="secondary" className="bg-navy text-white">
                      {popupBanners.length}{' '}
                      {popupBanners.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Dismissible popup ads shown to customers automatically or after sign in
                  </p>
                </div>
              </div>
              <Button
                onClick={openCreatePopupDialog}
                variant="outline"
                size="sm"
                className="border-champagne text-navy hover:bg-champagne/20"
                data-testid="button-add-popup-ad"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Popup Ad
              </Button>
            </div>

            {popupBanners.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                No popup ads yet
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popupBanners.map((popup) => (
                  <div
                    key={popup.id}
                    data-testid={`card-popup-${popup.id}`}
                    className="border rounded-lg overflow-hidden bg-white"
                  >
                    {popup.imageUrl ? (
                      <img
                        src={popup.imageUrl}
                        alt={popup.title}
                        className="w-full h-40 object-cover bg-gray-50"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-300">
                        <Image className="h-10 w-10" />
                      </div>
                    )}
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-navy line-clamp-1">
                          {popup.title}
                        </h3>
                        {popup.isActive ? (
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shrink-0">
                            <Eye className="h-3 w-3 mr-1" />
                            On
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="shrink-0">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Off
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>
                          Trigger:{' '}
                          <span className="font-medium text-navy">
                            {popup.triggerType === 'login'
                              ? 'After Sign In'
                              : 'Automatic Display'}
                          </span>
                        </div>
                        {popup.linkUrl && (
                          <div className="flex items-center gap-1 truncate">
                            <MousePointerClick className="h-3 w-3 shrink-0" />
                            <span className="truncate">{popup.linkUrl}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={popup.isActive ?? false}
                            onCheckedChange={(checked) =>
                              togglePopupActiveMutation.mutate({
                                id: popup.id,
                                isActive: checked,
                              })
                            }
                            disabled={togglePopupActiveMutation.isPending}
                            data-testid={`switch-popup-active-${popup.id}`}
                          />
                          <span className="text-xs text-gray-600">
                            {popup.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditPopupDialog(popup)}
                            data-testid={`button-edit-popup-${popup.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeletePopup(popup)}
                            data-testid={`button-delete-popup-${popup.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== Popup Ad Create / Edit Dialog ===== */}
      <Dialog
        open={isPopupDialogOpen}
        onOpenChange={(open) => {
          setIsPopupDialogOpen(open);
          if (!open) resetPopupForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPopup ? 'Edit Popup Ad' : 'Create Popup Ad'}
            </DialogTitle>
            <DialogDescription>
              Upload a banner image, add a link, and choose when to show it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label htmlFor="popup-title">Title</Label>
              <Input
                id="popup-title"
                value={popupForm.title}
                onChange={(e) =>
                  setPopupForm({ ...popupForm, title: e.target.value })
                }
                placeholder="e.g. Diwali Special Offer"
                data-testid="input-popup-title"
              />
              <p className="text-xs text-gray-500 mt-1">
                For internal use — won't be shown if an image is uploaded.
              </p>
            </div>

            <div>
              <Label>Banner Image</Label>
              {popupForm.imageUrl ? (
                <div className="relative mt-2 rounded-lg overflow-hidden border">
                  <img
                    src={popupForm.imageUrl}
                    alt="Preview"
                    className="w-full max-h-64 object-contain bg-gray-50"
                    data-testid="img-popup-preview"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                    onClick={() =>
                      setPopupForm({ ...popupForm, imageUrl: '' })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="h-6 w-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    Click to upload an image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePopupImageUpload(file);
                    }}
                    data-testid="input-popup-image"
                  />
                </label>
              )}
            </div>

            <div>
              <Label htmlFor="popup-link">Link URL</Label>
              <Input
                id="popup-link"
                value={popupForm.linkUrl}
                onChange={(e) =>
                  setPopupForm({ ...popupForm, linkUrl: e.target.value })
                }
                placeholder="https://... or /shop/diwali"
                data-testid="input-popup-link"
              />
              <p className="text-xs text-gray-500 mt-1">
                Where customers will go when they click the popup. Leave blank for no link.
              </p>
            </div>

            <div>
              <Label>When to show</Label>
              <Select
                value={popupForm.triggerType}
                onValueChange={(v) =>
                  setPopupForm({
                    ...popupForm,
                    triggerType: v as 'page_load' | 'login',
                  })
                }
              >
                <SelectTrigger
                  className="mt-1"
                  data-testid="select-popup-trigger"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="page_load">
                    Automatic display (when page loads)
                  </SelectItem>
                  <SelectItem value="login">After sign in</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Show only once per customer</Label>
                <p className="text-xs text-gray-500">
                  After they close it, it won't show again.
                </p>
              </div>
              <Switch
                checked={popupForm.showOnce}
                onCheckedChange={(checked) =>
                  setPopupForm({ ...popupForm, showOnce: checked })
                }
                data-testid="switch-popup-show-once"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm">Active</Label>
                <p className="text-xs text-gray-500">
                  Turn off to hide the popup without deleting it.
                </p>
              </div>
              <Switch
                checked={popupForm.isActive}
                onCheckedChange={(checked) =>
                  setPopupForm({ ...popupForm, isActive: checked })
                }
                data-testid="switch-popup-is-active"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsPopupDialogOpen(false);
                  resetPopupForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-champagne text-navy hover:bg-champagne/80"
                onClick={handleSavePopup}
                disabled={
                  createPopupMutation.isPending || updatePopupMutation.isPending
                }
                data-testid="button-save-popup"
              >
                <Save className="h-4 w-4 mr-2" />
                {createPopupMutation.isPending || updatePopupMutation.isPending
                  ? 'Saving...'
                  : editingPopup
                  ? 'Update Popup Ad'
                  : 'Create Popup Ad'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm — Banner */}
      <Dialog open={!!deleteConfirmBanner} onOpenChange={() => setDeleteConfirmBanner(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Banner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>"{deleteConfirmBanner?.title}"</strong>?
            This cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmBanner(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDeleteBanner}
              disabled={deleteBannerMutation.isPending}
            >
              {deleteBannerMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm — Popup */}
      <Dialog open={!!deleteConfirmPopup} onOpenChange={() => setDeleteConfirmPopup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Popup Ad</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>"{deleteConfirmPopup?.title}"</strong>?
            This cannot be undone.
          </p>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmPopup(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDeletePopup}
              disabled={deletePopupMutation.isPending}
            >
              {deletePopupMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
