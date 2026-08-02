import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Plus, Trash2, Save, ArrowUp, ArrowDown, Image, Type, Heading1, Heading2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import type { PageContent } from '@shared/schema';

type Section = {
  id: string;
  type: 'heading' | 'subheading' | 'text' | 'image';
  content: string;
  order: number;
};

type ContactInfo = {
  phone?: string;
  email?: string;
  address?: string;
  mapUrl?: string;
  whatsapp?: string;
  businessHours?: string;
  socialLinks?: { platform: string; url: string }[];
};

export default function PageEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('about_us');
  const [title, setTitle] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({});

  if (!user || user.role !== 'super_admin') {
    setLocation('/super-admin/login');
    return null;
  }

  const { data: aboutContent, isLoading: aboutLoading } = useQuery<PageContent>({
    queryKey: ['/api/page-content/about_us'],
  });

  const { data: contactContent, isLoading: contactLoading } = useQuery<PageContent>({
    queryKey: ['/api/page-content/contact_us'],
  });

  useEffect(() => {
    if (activeTab === 'about_us' && aboutContent) {
      setTitle(aboutContent.title || '');
      setSections((aboutContent.sections as Section[]) || []);
    } else if (activeTab === 'contact_us' && contactContent) {
      setTitle(contactContent.title || '');
      setSections((contactContent.sections as Section[]) || []);
      setContactInfo((contactContent.contactInfo as ContactInfo) || {});
    }
  }, [activeTab, aboutContent, contactContent]);

  const saveMutation = useMutation({
    mutationFn: async (data: { pageType: string; title: string; sections: Section[]; contactInfo?: ContactInfo }) => {
      return apiRequest('/api/super-admin/page-content', { method: 'POST', body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/page-content/' + activeTab] });
      toast({ title: 'Page saved successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const addSection = (type: Section['type']) => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      content: '',
      order: sections.length
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, content: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, content } : s));
  };

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i })));
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return;
    
    const newSections = [...sections];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]];
    setSections(newSections.map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = () => {
    saveMutation.mutate({
      pageType: activeTab,
      title,
      sections,
      contactInfo: activeTab === 'contact_us' ? contactInfo : undefined
    });
  };

  const handleImageUpload = (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      updateSection(sectionId, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const isLoading = aboutLoading || contactLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-96 bg-gray-200 rounded" />
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
            <FileText className="h-8 w-8 text-champagne" />
            <h1 className="text-3xl font-bold text-navy">Page Editor</h1>
          </div>
          <Button data-testid="button-save-page" onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="about_us" data-testid="tab-about-us">About Us</TabsTrigger>
            <TabsTrigger value="contact_us" data-testid="tab-contact-us">Contact Us</TabsTrigger>
          </TabsList>

          <TabsContent value="about_us">
            <Card>
              <CardHeader>
                <CardTitle>About Us Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Page Title</Label>
                  <Input
                    data-testid="input-page-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="About Pathak Bhandar"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => addSection('heading')} data-testid="button-add-heading">
                    <Heading1 className="h-4 w-4 mr-1" /> Add Heading
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addSection('subheading')} data-testid="button-add-subheading">
                    <Heading2 className="h-4 w-4 mr-1" /> Add Subheading
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addSection('text')} data-testid="button-add-text">
                    <Type className="h-4 w-4 mr-1" /> Add Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addSection('image')} data-testid="button-add-image">
                    <Image className="h-4 w-4 mr-1" /> Add Image
                  </Button>
                </div>

                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div key={section.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize text-gray-600">{section.type}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'up')} disabled={index === 0}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'down')} disabled={index === sections.length - 1}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)} className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {section.type === 'image' ? (
                        <div>
                          {section.content && (
                            <img src={section.content} alt="Section" className="max-h-48 mb-2 rounded" />
                          )}
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(section.id, e)}
                            data-testid={`input-image-${section.id}`}
                          />
                        </div>
                      ) : section.type === 'text' ? (
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, e.target.value)}
                          placeholder="Enter text content..."
                          rows={4}
                          data-testid={`input-text-${section.id}`}
                        />
                      ) : (
                        <Input
                          value={section.content}
                          onChange={(e) => updateSection(section.id, e.target.value)}
                          placeholder={`Enter ${section.type}...`}
                          data-testid={`input-${section.type}-${section.id}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact_us">
            <Card>
              <CardHeader>
                <CardTitle>Contact Us Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Page Title</Label>
                  <Input
                    data-testid="input-contact-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contact Us"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      data-testid="input-contact-phone"
                      value={contactInfo.phone || ''}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      data-testid="input-contact-email"
                      value={contactInfo.email || ''}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      placeholder="contact@pathakbhandar.in"
                    />
                  </div>
                  <div>
                    <Label>WhatsApp</Label>
                    <Input
                      data-testid="input-contact-whatsapp"
                      value={contactInfo.whatsapp || ''}
                      onChange={(e) => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <Label>Business Hours</Label>
                    <Input
                      data-testid="input-contact-hours"
                      value={contactInfo.businessHours || ''}
                      onChange={(e) => setContactInfo({ ...contactInfo, businessHours: e.target.value })}
                      placeholder="Mon-Sat: 9AM - 9PM"
                    />
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  <Textarea
                    data-testid="input-contact-address"
                    value={contactInfo.address || ''}
                    onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                    placeholder="Full store address"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Google Maps Embed URL</Label>
                  <Input
                    data-testid="input-contact-map"
                    value={contactInfo.mapUrl || ''}
                    onChange={(e) => setContactInfo({ ...contactInfo, mapUrl: e.target.value })}
                    placeholder="https://www.google.com/maps/embed?..."
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">Content Sections</h3>
                  <div className="flex gap-2 flex-wrap mb-4">
                    <Button variant="outline" size="sm" onClick={() => addSection('heading')}>
                      <Heading1 className="h-4 w-4 mr-1" /> Add Heading
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addSection('text')}>
                      <Type className="h-4 w-4 mr-1" /> Add Text
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => addSection('image')}>
                      <Image className="h-4 w-4 mr-1" /> Add Image
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <div key={section.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize text-gray-600">{section.type}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'up')} disabled={index === 0}>
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => moveSection(section.id, 'down')} disabled={index === sections.length - 1}>
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)} className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {section.type === 'image' ? (
                          <div>
                            {section.content && <img src={section.content} alt="Section" className="max-h-48 mb-2 rounded" />}
                            <Input type="file" accept="image/*" onChange={(e) => handleImageUpload(section.id, e)} />
                          </div>
                        ) : section.type === 'text' ? (
                          <Textarea
                            value={section.content}
                            onChange={(e) => updateSection(section.id, e.target.value)}
                            placeholder="Enter text content..."
                            rows={4}
                          />
                        ) : (
                          <Input
                            value={section.content}
                            onChange={(e) => updateSection(section.id, e.target.value)}
                            placeholder={`Enter ${section.type}...`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
