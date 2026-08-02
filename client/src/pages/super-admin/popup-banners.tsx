import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, Plus, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { PopupBanner } from '@shared/schema';

export default function PopupBannersManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PopupBanner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    triggerType: 'login',
    showOnce: true,
    isActive: true
  });

  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  const { data: banners, isLoading } = useQuery<PopupBanner[]>({
    queryKey: ['/api/super-admin/popup-banners'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/super-admin/popup-banners', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/popup-banners'] });
      setIsOpen(false);
      resetForm();
      toast({ title: 'Popup banner created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      return apiRequest(`/api/super-admin/popup-banners/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/popup-banners'] });
      setIsOpen(false);
      setEditingBanner(null);
      resetForm();
      toast({ title: 'Popup banner updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/super-admin/popup-banners/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/popup-banners'] });
      toast({ title: 'Popup banner deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      imageUrl: '',
      linkUrl: '',
      triggerType: 'login',
      showOnce: true,
      isActive: true
    });
  };

  const handleEdit = (banner: PopupBanner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      triggerType: banner.triggerType,
      showOnce: banner.showOnce || false,
      isActive: banner.isActive || false
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-champagne" />
            <h1 className="text-3xl font-bold text-navy">Popup Banners</h1>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setEditingBanner(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-popup" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Popup
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingBanner ? 'Edit' : 'Create'} Popup Banner</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    data-testid="input-popup-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter banner title"
                  />
                </div>
                <div>
                  <Label>Banner Image</Label>
                  {formData.imageUrl && (
                    <img src={formData.imageUrl} alt="Preview" className="max-h-32 mb-2 rounded" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    data-testid="input-popup-image"
                  />
                </div>
                <div>
                  <Label>Link URL (optional)</Label>
                  <Input
                    data-testid="input-popup-link"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Trigger Type</Label>
                  <Select
                    value={formData.triggerType}
                    onValueChange={(v) => setFormData({ ...formData, triggerType: v })}
                  >
                    <SelectTrigger data-testid="select-trigger-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="login">After Login</SelectItem>
                      <SelectItem value="page_load">On Page Load</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Only Once Per User</Label>
                  <Switch
                    checked={formData.showOnce}
                    onCheckedChange={(checked) => setFormData({ ...formData, showOnce: checked })}
                    data-testid="switch-show-once"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    data-testid="switch-active"
                  />
                </div>
                <Button
                  data-testid="button-submit-popup"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending || !formData.title}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingBanner ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Popup Banners</CardTitle>
          </CardHeader>
          <CardContent>
            {banners?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No popup banners created yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners?.map((banner) => (
                  <div
                    key={banner.id}
                    data-testid={`card-popup-${banner.id}`}
                    className="border rounded-lg overflow-hidden bg-white"
                  >
                    {banner.imageUrl && (
                      <img src={banner.imageUrl} alt={banner.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-navy">{banner.title}</h3>
                        {banner.isActive ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        Trigger: {banner.triggerType === 'login' ? 'After Login' : 'On Page Load'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(banner)}
                          data-testid={`button-edit-${banner.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500"
                          onClick={() => deleteMutation.mutate(banner.id)}
                          data-testid={`button-delete-${banner.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
