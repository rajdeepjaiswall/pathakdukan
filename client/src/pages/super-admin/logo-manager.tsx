import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, Image, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/header';

export default function LogoManager() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const response = await fetch('/api/super-admin/logo', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({
                imageData: reader.result
              }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to upload logo');
            }
            
            const result = await response.json();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Logo uploaded successfully and is now live across the platform",
      });
      setPreviewUrl('');
      setLogoFile(null);
      // Force reload to show new logo immediately
      setTimeout(() => window.location.reload(), 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveLogo = () => {
    if (logoFile) {
      uploadLogo.mutate(logoFile);
    } else if (logoUrl) {
      // Handle URL upload - convert to file first
      fetch(logoUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'logo.png', { type: blob.type });
          uploadLogo.mutate(file);
        })
        .catch(() => {
          toast({
            title: "Error",
            description: "Could not fetch image from URL",
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "No Logo Selected",
        description: "Please select a logo file or enter a URL.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => setLocation('/super-admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-navy">Logo Manager</h1>
            <p className="text-gray-600">Upload and manage your Pathak Bhandar bakery logo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Logo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="logo-file">Upload Logo File</Label>
                <Input
                  id="logo-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500">
                  Recommended: PNG or SVG format, 200x200px minimum
                </p>
              </div>

              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="logo-url">Or Enter Logo URL</Label>
                <Input
                  id="logo-url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveLogo}
                disabled={uploadLogo.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {uploadLogo.isPending ? 'Uploading...' : 'Save Logo'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Logo */}
                <div>
                  <h3 className="font-semibold mb-3">Current Logo</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-orange-600 rounded-lg flex items-center justify-center">
                      <img 
                        src={`/api/logo?v=${Date.now()}`}
                        alt="Current Logo"
                        className="w-full h-full object-contain rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <span className="text-white font-bold text-xl hidden items-center justify-center">PB</span>
                    </div>
                    <p className="text-gray-500">Current bakery logo</p>
                  </div>
                </div>

                {/* New Logo Preview */}
                {(previewUrl || logoUrl) && (
                  <div>
                    <h3 className="font-semibold mb-3">New Logo Preview</h3>
                    <div className="border-2 border-gray-300 rounded-lg p-4 text-center">
                      <img
                        src={previewUrl || logoUrl}
                        alt="Logo Preview"
                        className="max-w-full max-h-32 mx-auto object-contain"
                        onError={() => {
                          toast({
                            title: "Image Error",
                            description: "Could not load the image. Please check the URL or file.",
                            variant: "destructive",
                          });
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Guidelines */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Logo Guidelines</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Use high-resolution images (minimum 200x200px)</li>
                    <li>• PNG format with transparent background works best</li>
                    <li>• Keep design simple and readable</li>
                    <li>• Ensure it looks good on both light and dark backgrounds</li>
                    <li>• Consider how it will appear on mobile devices</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}