import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Phone,
  Mail,
  MapPin,
  Store,
  Image as ImageIcon,
  Loader2,
  Eye,
  Save,
  Send,
  Upload,
  ArrowLeft,
} from 'lucide-react';
import { SiWhatsapp, SiFacebook, SiInstagram } from 'react-icons/si';
import type { ContactData, ContactSettings } from '@shared/schema';

function isValidUrl(s: string) {
  if (!s) return true;
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}
function isValidEmail(s: string) {
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function AdminContactSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  const [form, setForm] = useState<ContactData>({
    storeName: '',
    profileImage: '',
    phone: '',
    email: '',
    address: '',
    socialLinks: { whatsapp: '', facebook: '', instagram: '', email: '' },
  });

  const { data: settings, isLoading } = useQuery<ContactSettings>({
    queryKey: ['/api/admin/contact-settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/contact-settings');
      return res.json();
    },
  });

  useEffect(() => {
    if (settings?.draftData) {
      const d = settings.draftData;
      setForm({
        storeName: d.storeName || '',
        profileImage: d.profileImage || '',
        phone: d.phone || '',
        email: d.email || '',
        address: d.address || '',
        socialLinks: {
          whatsapp: d.socialLinks?.whatsapp || '',
          facebook: d.socialLinks?.facebook || '',
          instagram: d.socialLinks?.instagram || '',
          email: d.socialLinks?.email || '',
        },
      });
    }
  }, [settings]);

  const validate = (): string | null => {
    if (form.email && !isValidEmail(form.email)) return 'Email address is not valid.';
    if (form.socialLinks?.email && !isValidEmail(form.socialLinks.email))
      return 'Social Email address is not valid.';
    if (form.socialLinks?.facebook && !isValidUrl(form.socialLinks.facebook))
      return 'Facebook URL is not valid (must start with http:// or https://).';
    if (form.socialLinks?.instagram && !isValidUrl(form.socialLinks.instagram))
      return 'Instagram URL is not valid (must start with http:// or https://).';
    return null;
  };

  const cleanedPayload = (): ContactData => ({
    storeName: form.storeName?.trim() || undefined,
    profileImage: form.profileImage?.trim() || undefined,
    phone: form.phone?.trim() || undefined,
    email: form.email?.trim() || undefined,
    address: form.address?.trim() || undefined,
    socialLinks: {
      whatsapp: form.socialLinks?.whatsapp?.trim() || undefined,
      facebook: form.socialLinks?.facebook?.trim() || undefined,
      instagram: form.socialLinks?.instagram?.trim() || undefined,
      email: form.socialLinks?.email?.trim() || undefined,
    },
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', '/api/admin/contact-settings', cleanedPayload());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Draft saved', description: 'Your changes are stored. Push Live to update the website.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contact-settings'] });
    },
    onError: (e: any) => {
      toast({ title: 'Could not save', description: e.message || 'Try again.', variant: 'destructive' });
    },
  });

  const publishMut = useMutation({
    mutationFn: async () => {
      // Save first, then publish
      await apiRequest('PATCH', '/api/admin/contact-settings', cleanedPayload());
      const res = await apiRequest('POST', '/api/admin/contact-settings/publish', {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Published',
        description: 'The Contact Us page now shows your latest changes.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contact-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contact-info'] });
    },
    onError: (e: any) => {
      toast({ title: 'Publish failed', description: e.message || 'Try again.', variant: 'destructive' });
    },
  });

  const onSave = () => {
    const err = validate();
    if (err) {
      toast({ title: 'Please fix the form', description: err, variant: 'destructive' });
      return;
    }
    saveMut.mutate();
  };

  const onPublish = () => {
    const err = validate();
    if (err) {
      toast({ title: 'Please fix the form', description: err, variant: 'destructive' });
      return;
    }
    publishMut.mutate();
  };

  const onPreview = () => {
    window.open('/contact-us', '_blank');
  };

  const onPickImage = () => fileRef.current?.click();
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please pick an image under 2 MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, profileImage: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div className="animate-pulse h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const lastSaved = settings?.updatedAt
    ? new Date(settings.updatedAt as any).toLocaleString('en-IN')
    : 'Never';
  const lastPublished = settings?.publishedAt
    ? new Date(settings.publishedAt as any).toLocaleString('en-IN')
    : 'Never';

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/admin/dashboard')}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-navy">Contact Us Editor</h1>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-6 text-sm text-gray-700">
          <p>
            <strong>Save</strong> stores your changes as a draft (visitors will not see them yet).
            Click <strong>Push Live</strong> to update the public Contact Us page.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Draft last saved: <strong>{lastSaved}</strong> &nbsp;|&nbsp; Published: <strong>{lastPublished}</strong>
          </p>
        </div>

        {/* Basic info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" /> Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Store Name</Label>
              <Input
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="Pathak Bhandar"
                data-testid="input-store-name"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" /> Profile Image
              </Label>
              <div className="flex items-center gap-4 mt-2">
                {form.profileImage ? (
                  <img
                    src={form.profileImage}
                    alt="Profile preview"
                    className="h-20 w-20 rounded-full object-cover border-2 border-champagne"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-100 border flex items-center justify-center">
                    <Store className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onPickImage}
                      data-testid="button-upload-image"
                    >
                      <Upload className="h-4 w-4 mr-1" /> Upload
                    </Button>
                    {form.profileImage && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setForm({ ...form, profileImage: '' })}
                        data-testid="button-clear-image"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="…or paste image URL"
                    value={form.profileImage?.startsWith('data:') ? '' : form.profileImage || ''}
                    onChange={(e) => setForm({ ...form, profileImage: e.target.value })}
                    data-testid="input-image-url"
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onImageChange}
                  />
                  <p className="text-xs text-gray-500">
                    Use a square image (PNG/JPG, under 2 MB) for best results.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" /> Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Phone Number</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210"
                data-testid="input-phone"
              />
              <p className="text-xs text-gray-500 mt-1">Shown as a tap-to-call link.</p>
            </div>
            <div>
              <Label>Email Address</Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="hello@pathakbhandar.in"
                data-testid="input-email"
              />
            </div>
            <div>
              <Label className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Address (optional)
              </Label>
              <Textarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Shop address, area, city, pincode"
                data-testid="input-address"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social links */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <SiWhatsapp className="h-4 w-4 text-green-600" /> WhatsApp Number
              </Label>
              <Input
                value={form.socialLinks?.whatsapp}
                onChange={(e) =>
                  setForm({ ...form, socialLinks: { ...form.socialLinks, whatsapp: e.target.value } })
                }
                placeholder="+919876543210"
                data-testid="input-whatsapp"
              />
              <p className="text-xs text-gray-500 mt-1">
                Will open as <code>https://wa.me/&lt;number&gt;</code>. Country code recommended.
              </p>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <SiFacebook className="h-4 w-4 text-blue-600" /> Facebook URL
              </Label>
              <Input
                value={form.socialLinks?.facebook}
                onChange={(e) =>
                  setForm({ ...form, socialLinks: { ...form.socialLinks, facebook: e.target.value } })
                }
                placeholder="https://facebook.com/yourpage"
                data-testid="input-facebook"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <SiInstagram className="h-4 w-4 text-pink-600" /> Instagram URL
              </Label>
              <Input
                value={form.socialLinks?.instagram}
                onChange={(e) =>
                  setForm({ ...form, socialLinks: { ...form.socialLinks, instagram: e.target.value } })
                }
                placeholder="https://instagram.com/yourpage"
                data-testid="input-instagram"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-champagne" /> Email (mailto)
              </Label>
              <Input
                value={form.socialLinks?.email}
                onChange={(e) =>
                  setForm({ ...form, socialLinks: { ...form.socialLinks, email: e.target.value } })
                }
                placeholder="contact@pathakbhandar.in"
                data-testid="input-social-email"
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for the email icon in the social row. Can match the email above or be a different mailbox.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onPreview}
              data-testid="button-preview"
            >
              <Eye className="h-4 w-4 mr-1" /> Preview Live Page
            </Button>
            <Button
              variant="secondary"
              onClick={onSave}
              disabled={saveMut.isPending}
              data-testid="button-save"
            >
              {saveMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={onPublish}
              disabled={publishMut.isPending}
              className="bg-champagne text-navy hover:bg-champagne/90"
              data-testid="button-publish"
            >
              {publishMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Push Live
            </Button>
          </CardContent>
        </Card>

        <Separator className="my-8" />
        <p className="text-xs text-gray-400 text-center">
          Empty fields are hidden from the public Contact Us page automatically.
        </p>
      </div>
    </div>
  );
}
