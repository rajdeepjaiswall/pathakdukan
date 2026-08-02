import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, Save, Send, Upload, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import type { HeaderConfig, SiteSettings } from '@shared/schema';

export default function AdminHeaderSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  const [form, setForm] = useState<HeaderConfig>({
    logo: '',
    showSearch: true,
    showMenu: true,
  });

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['/api/admin/site-settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/site-settings');
      return res.json();
    },
  });

  useEffect(() => {
    const d = (settings?.headerDraft || {}) as HeaderConfig;
    setForm({
      logo: d.logo || '',
      showSearch: d.showSearch !== false,
      showMenu: d.showMenu !== false,
    });
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', '/api/admin/site-settings/header', form);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Draft saved', description: 'Your header draft is stored. Push Live to update the website.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
    },
    onError: (e: any) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' }),
  });

  const publishMut = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', '/api/admin/site-settings/header', form);
      const res = await apiRequest('POST', '/api/admin/site-settings/header/publish', {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Published', description: 'The header is now live on the website.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
    },
    onError: (e: any) => toast({ title: 'Publish failed', description: e.message, variant: 'destructive' }),
  });

  const onPickImage = () => fileRef.current?.click();
  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image too large', description: 'Please pick an image under 2 MB.', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, logo: reader.result as string }));
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

  const lastSaved = settings?.updatedAt ? new Date(settings.updatedAt as any).toLocaleString('en-IN') : 'Never';
  const lastPublished = settings?.headerPublishedAt ? new Date(settings.headerPublishedAt as any).toLocaleString('en-IN') : 'Never';

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/dashboard')} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-navy">Header Editor</h1>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-6 text-sm text-gray-700">
          <p>
            <strong>Save</strong> stores changes as a draft. Click <strong>Push Live</strong> to update the public website header.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Draft last saved: <strong>{lastSaved}</strong> &nbsp;|&nbsp; Published: <strong>{lastPublished}</strong>
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" /> Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-28 h-20 rounded border bg-white flex items-center justify-center overflow-hidden">
                {form.logo ? (
                  <img src={form.logo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">No logo</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImageChange} />
                <Button type="button" variant="outline" onClick={onPickImage} data-testid="button-upload-logo">
                  <Upload className="h-4 w-4 mr-2" /> Upload Logo
                </Button>
                {form.logo && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, logo: '' }))} data-testid="button-remove-logo">
                    <X className="h-4 w-4 mr-1" /> Remove (use default)
                  </Button>
                )}
                <p className="text-xs text-gray-500">PNG/JPG/SVG up to 2 MB. Leave empty to use the default site logo.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Header Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between border rounded p-3">
              <div>
                <Label className="text-base">Show Search Icon</Label>
                <p className="text-xs text-gray-500">Hide if you don't want a search button in the header.</p>
              </div>
              <Switch
                checked={form.showSearch !== false}
                onCheckedChange={(v) => setForm((f) => ({ ...f, showSearch: v }))}
                data-testid="switch-show-search"
              />
            </div>
            <div className="flex items-center justify-between border rounded p-3">
              <div>
                <Label className="text-base">Show Menu (Hamburger)</Label>
                <p className="text-xs text-gray-500">Hide if you don't want the right-side menu icon.</p>
              </div>
              <Switch
                checked={form.showMenu !== false}
                onCheckedChange={(v) => setForm((f) => ({ ...f, showMenu: v }))}
                data-testid="switch-show-menu"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={() => window.open('/', '_blank')} data-testid="button-preview">
            <Eye className="h-4 w-4 mr-2" /> Preview Site
          </Button>
          <Button variant="secondary" onClick={() => saveMut.mutate()} disabled={saveMut.isPending} data-testid="button-save">
            {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
          </Button>
          <Button onClick={() => publishMut.mutate()} disabled={publishMut.isPending} data-testid="button-publish">
            {publishMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Push Live
          </Button>
        </div>
      </div>
    </div>
  );
}
