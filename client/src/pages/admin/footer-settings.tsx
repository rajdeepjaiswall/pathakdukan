import { useEffect, useRef, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, Eye, Save, Send, Upload, ArrowLeft, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import type { FooterConfig, SiteSettings, FooterSitemapItem } from '@shared/schema';

export default function AdminFooterSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    setLocation('/admin/login');
    return null;
  }

  const [form, setForm] = useState<FooterConfig>({
    logo: '',
    description: '',
    sitemap: [],
    showFoundationBadge: true,
  });

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ['/api/admin/site-settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/site-settings');
      return res.json();
    },
  });

  useEffect(() => {
    const d = (settings?.footerDraft || {}) as FooterConfig;
    setForm({
      logo: d.logo || '',
      description: d.description || '',
      sitemap: Array.isArray(d.sitemap) ? d.sitemap : [],
      showFoundationBadge: d.showFoundationBadge !== false,
    });
  }, [settings]);

  const validate = (): string | null => {
    for (const item of form.sitemap || []) {
      if (!item.title?.trim() || !item.link?.trim()) {
        return 'Each sitemap entry needs both Title and Link.';
      }
    }
    return null;
  };

  const cleaned = (): FooterConfig => ({
    logo: form.logo?.trim() || undefined,
    description: form.description?.trim() || undefined,
    sitemap: (form.sitemap || [])
      .map((s) => ({ title: s.title.trim(), link: s.link.trim() }))
      .filter((s) => s.title && s.link),
    showFoundationBadge: form.showFoundationBadge !== false,
  });

  const saveMut = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', '/api/admin/site-settings/footer', cleaned());
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Draft saved', description: 'Footer draft saved. Push Live to publish.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
    },
    onError: (e: any) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' }),
  });

  const publishMut = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', '/api/admin/site-settings/footer', cleaned());
      const res = await apiRequest('POST', '/api/admin/site-settings/footer/publish', {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Published', description: 'Your footer is live on the website.' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/site-settings'] });
    },
    onError: (e: any) => toast({ title: 'Publish failed', description: e.message, variant: 'destructive' }),
  });

  const onSave = () => {
    const err = validate();
    if (err) return toast({ title: 'Please fix the form', description: err, variant: 'destructive' });
    saveMut.mutate();
  };
  const onPublish = () => {
    const err = validate();
    if (err) return toast({ title: 'Please fix the form', description: err, variant: 'destructive' });
    publishMut.mutate();
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
    reader.onload = () => setForm((f) => ({ ...f, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const addSitemap = () =>
    setForm((f) => ({ ...f, sitemap: [...(f.sitemap || []), { title: '', link: '' }] }));
  const updateSitemap = (idx: number, key: keyof FooterSitemapItem, value: string) =>
    setForm((f) => ({
      ...f,
      sitemap: (f.sitemap || []).map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
    }));
  const removeSitemap = (idx: number) =>
    setForm((f) => ({ ...f, sitemap: (f.sitemap || []).filter((_, i) => i !== idx) }));

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
  const lastPublished = settings?.footerPublishedAt ? new Date(settings.footerPublishedAt as any).toLocaleString('en-IN') : 'Never';

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/admin/dashboard')} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-navy">Footer Editor</h1>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-6 text-sm text-gray-700">
          <p>
            <strong>Save</strong> stores changes as a draft. Click <strong>Push Live</strong> to update the public footer.
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
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-28 h-20 rounded border bg-white flex items-center justify-center overflow-hidden">
                {form.logo ? (
                  <img src={form.logo} alt="Footer logo preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">Default badge</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImageChange} />
                <Button type="button" variant="outline" onClick={onPickImage} data-testid="button-upload-footer-logo">
                  <Upload className="h-4 w-4 mr-2" /> Upload Logo
                </Button>
                {form.logo && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, logo: '' }))} data-testid="button-remove-footer-logo">
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                )}
                <p className="text-xs text-gray-500">PNG/JPG/SVG up to 2 MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="text-sm">Short paragraph shown below the logo</Label>
            <Textarea
              rows={4}
              maxLength={500}
              value={form.description || ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="A short description of your store…"
              data-testid="input-footer-description"
            />
            <p className="text-xs text-gray-500 mt-1">{(form.description || '').length}/500</p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sitemap (Horizontal Links)</span>
              <Button type="button" size="sm" onClick={addSitemap} data-testid="button-add-sitemap">
                <Plus className="h-4 w-4 mr-1" /> Add Link
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(form.sitemap || []).length === 0 && (
              <p className="text-sm text-gray-500">
                No links yet. Default links (Home, Products, About, Contact) will be shown until you add your own.
              </p>
            )}
            {(form.sitemap || []).map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                <Input
                  placeholder="Title (e.g. Home)"
                  value={item.title}
                  onChange={(e) => updateSitemap(idx, 'title', e.target.value)}
                  className="sm:w-1/3"
                  data-testid={`input-sitemap-title-${idx}`}
                />
                <Input
                  placeholder="Link (e.g. / or /products)"
                  value={item.link}
                  onChange={(e) => updateSitemap(idx, 'link', e.target.value)}
                  className="sm:flex-1"
                  data-testid={`input-sitemap-link-${idx}`}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeSitemap(idx)} data-testid={`button-remove-sitemap-${idx}`}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Foundation Badge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between border rounded p-3">
              <div>
                <Label className="text-base">Show "Managed by GetDown Foundation" badge</Label>
                <p className="text-xs text-gray-500">A subtle green badge linking to the GetDown Foundation page.</p>
              </div>
              <Switch
                checked={form.showFoundationBadge !== false}
                onCheckedChange={(v) => setForm((f) => ({ ...f, showFoundationBadge: v }))}
                data-testid="switch-foundation-badge"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={() => window.open('/', '_blank')} data-testid="button-preview">
            <Eye className="h-4 w-4 mr-2" /> Preview Site
          </Button>
          <Button variant="secondary" onClick={onSave} disabled={saveMut.isPending} data-testid="button-save">
            {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
          </Button>
          <Button onClick={onPublish} disabled={publishMut.isPending} data-testid="button-publish">
            {publishMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Push Live
          </Button>
        </div>
      </div>
    </div>
  );
}
