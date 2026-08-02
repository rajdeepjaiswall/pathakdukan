import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useMutation } from '@tanstack/react-query';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  showEditButton?: boolean;
}

export default function ProfileImageUpload({ 
  currentImageUrl, 
  userName = 'User',
  size = 'md',
  showEditButton = true 
}: ProfileImageUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user, updateUser } = useAuth();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-16 w-16',
    lg: 'h-24 w-24'
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        credentials: 'include',
        body: JSON.stringify({ imageData: base64 }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Profile image updated successfully!",
      });
      
      // Update user in auth context
      updateUser({ ...user!, ...data.user });
      
      setIsOpen(false);
      setPreviewUrl('');
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <Avatar className={`${sizeClasses[size]} cursor-pointer`}>
        <AvatarImage src={currentImageUrl} alt={userName} />
        <AvatarFallback className="bg-champagne text-navy font-semibold">
          {userName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {showEditButton && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-champagne text-navy hover:bg-champagne/90 p-0"
            >
              <Camera className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Profile Image</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Current/Preview Image */}
              <div className="flex justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={previewUrl || currentImageUrl} alt={userName} />
                  <AvatarFallback className="bg-champagne text-navy text-2xl font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* File Input */}
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </Button>
                
                {selectedFile && (
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-600 truncate">
                      {selectedFile.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemove}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="flex-1 bg-champagne text-navy hover:bg-champagne/90"
                >
                  {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}