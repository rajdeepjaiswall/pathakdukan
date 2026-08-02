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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye, Save, Send, Upload, ArrowLeft, Image as ImageIcon, X, KeyRound } from 'lucide-react';
import type { FoundationContent, FoundationSettings, WhatsappApiConfig } from '@shared/schema';

export default function SuperAdminFoundationSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  const [content, setContent] = useState<FoundationContent>({ logo: '', description: '' });
  const [api, setApi] = useState<WhatsappApiConfig>({
    provider: '',
    apiKey: '',
    senderId: '',
    phoneNumberId: '',
    templateName: '',
  });

  const { data: settings, isLoading } = useQuery<FoundationSettings>({
    queryKey: ['/api/super-admin/foundation'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/super-admin/foundation');
      return res.json();
    },
  });

  useEffect(() => {
    const c = (settings?.contentDraft || {}) as FoundationContent;
    setContent({ logo: c.logo || '', description: c.description || '' });
    const a = (settings?.whatsappApiConfig || {}) as WhatsappApiConfig;
    setApi({
      provider: a.provider || '',
      apiKey: a.apiKey || '',
      senderId: a.senderId || '',
      phoneNumberId: a.phoneNumberId || '',
      templateName: a.templateName || '',
    });
  }, [settings]);

  const saveContent = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', '/api/super-admin/foundation', {
        logo: content.logo?.trim() || undefined,
        description: content.description?.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Draft saved', description: 'Foundation page draft saved.' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/foundation'] });
    },
    onError: (e: any) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' }),
  });

  const publishContent = useMutation({
    mutationFn: async () => {
      await apiRequest('PATCH', '/api/super-admin/foundation', {
        logo: content.logo?.trim() || undefined,
        description: content.description?.trim() || undefined,
      });
      const res = await apiRequest('POST', '/api/super-admin/foundation/publish', {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Published', description: 'GetDown Foundation page is now live.' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/foundation'] });
      queryClient.invalidateQueries({ queryKey: ['/api/foundation'] });
    },
    onError: (e: any) => toast({ title: 'Publish failed', description: e.message, variant: 'destructive' }),
  });

  const saveApi = useMutation({
    mutationFn: async () => {
      const payload: WhatsappApiConfig = {
        provider: api.provider?.trim() || undefined,
        apiKey: api.apiKey?.trim() || undefined,
        senderId: api.senderId?.trim() || undefined,
        phoneNumberId: api.phoneNumberId?.trim() || undefined,
        templateName: api.templateName?.trim() || undefined,
      };
      const res = await apiRequest('PATCH', '/api/super-admin/foundation/whatsapp-config', payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'API config saved', description: 'WhatsApp API settings updated.' });
      queryClient.invalidateQueries({ queryKey: ['/api/super-admin/foundation'] });
    },
    onError: (e: any) => toast({ title: 'Could not save', description: e.message, variant: 'destructive' }),
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
    reader.onload = () => setContent((c) => ({ ...c, logo: reader.result as string }));
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
  const lastPublished = settings?.publishedAt ? new Date(settings.publishedAt as any).toLocaleString('en-IN') : 'Never';

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/super-admin/dashboard')} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-navy">GetDown Foundation Settings</h1>
        </div>

        <Tabs defaultValue="content">
          <TabsList className="mb-4">
            <TabsTrigger value="content" data-testid="tab-content">Public Page</TabsTrigger>
            <TabsTrigger value="whatsapp" data-testid="tab-whatsapp">WhatsApp API</TabsTrigger>
          </TabsList>

          <TabsContent value="content">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-6 text-sm text-gray-700">
              <p>
                Edit the logo and description shown on the public <strong>/getdown-foundation</strong> page.
                Use <strong>Save</strong> for a draft, or <strong>Push Live</strong> to publish.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Draft last saved: <strong>{lastSaved}</strong> &nbsp;|&nbsp; Published: <strong>{lastPublished}</strong>
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" /> Foundation Logo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 rounded-full border bg-white flex items-center justify-center overflow-hidden">
                    {content.logo ? (
                      <img src={content.logo} alt="Foundation logo" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400">No logo</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImageChange} />
                    <Button type="button" variant="outline" onClick={onPickImage} data-testid="button-upload-foundation-logo">
                      <Upload className="h-4 w-4 mr-2" /> Upload Logo
                    </Button>
                    {content.logo && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setContent((c) => ({ ...c, logo: '' }))} data-testid="button-remove-foundation-logo">
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
                <CardTitle>About GetDown Foundation</CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-sm">Description shown on the page</Label>
                <Textarea
                  rows={8}
                  maxLength={3000}
                  value={content.description || ''}
                  onChange={(e) => setContent((c) => ({ ...c, description: e.target.value }))}
                  placeholder="Tell visitors what GetDown Foundation does, who it serves, and how to get started…"
                  data-testid="input-foundation-description"
                />
                <p className="text-xs text-gray-500 mt-1">{(content.description || '').length}/3000</p>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3 justify-end">
              <Button variant="outline" onClick={() => window.open('/getdown-foundation', '_blank')} data-testid="button-preview">
                <Eye className="h-4 w-4 mr-2" /> Preview Page
              </Button>
              <Button variant="secondary" onClick={() => saveContent.mutate()} disabled={saveContent.isPending} data-testid="button-save-content">
                {saveContent.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save Draft
              </Button>
              <Button onClick={() => publishContent.mutate()} disabled={publishContent.isPending} data-testid="button-publish-content">
                {publishContent.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />} Push Live
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-6 text-sm text-gray-700">
              <p>
                Configure the WhatsApp API used to send OTP messages from the public Foundation enquiry form.
                These values are <strong>stored securely</strong> and are never returned to the public website.
              </p>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" /> WhatsApp API Config
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Provider (e.g. fast2sms, twilio, meta)</Label>
                  <Input value={api.provider || ''} onChange={(e) => setApi((a) => ({ ...a, provider: e.target.value }))} data-testid="input-api-provider" />
                </div>
                <div>
                  <Label>API Key / Token</Label>
                  <Input type="password" value={api.apiKey || ''} onChange={(e) => setApi((a) => ({ ...a, apiKey: e.target.value }))} data-testid="input-api-key" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Sender ID</Label>
                    <Input value={api.senderId || ''} onChange={(e) => setApi((a) => ({ ...a, senderId: e.target.value }))} data-testid="input-api-sender" />
                  </div>
                  <div>
                    <Label>Phone Number ID</Label>
                    <Input value={api.phoneNumberId || ''} onChange={(e) => setApi((a) => ({ ...a, phoneNumberId: e.target.value }))} data-testid="input-api-phone-id" />
                  </div>
                </div>
                <div>
                  <Label>Template Name</Label>
                  <Input value={api.templateName || ''} onChange={(e) => setApi((a) => ({ ...a, templateName: e.target.value }))} data-testid="input-api-template" />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => saveApi.mutate()} disabled={saveApi.isPending} data-testid="button-save-api">
                {saveApi.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Save API Config
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
