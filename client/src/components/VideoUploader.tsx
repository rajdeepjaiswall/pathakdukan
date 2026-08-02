import { useState, useRef } from 'react';
import { Upload, Video, X, Play, Pause, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface VideoUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
}

interface FileInfo {
  name: string;
  size: number;
  duration?: number;
  type: string;
}

export default function VideoUploader({ value, onChange, onRemove, className }: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const simulateUploadProgress = (): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          setUploadProgress(progress);
          clearInterval(interval);
          resolve();
        } else {
          setUploadProgress(progress);
        }
      }, 200);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset previous states
    setUploadError(null);
    setUploadProgress(0);
    setFileInfo(null);

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setUploadError('Invalid file type. Please select a video file.');
      toast({
        title: 'Invalid file type',
        description: 'Please select a video file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File too large. Video must be smaller than 50MB.');
      toast({
        title: 'File too large',
        description: 'Video file must be smaller than 50MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Get video duration
      const duration = await getVideoDuration(file);
      
      // Set file info
      const info: FileInfo = {
        name: file.name,
        size: file.size,
        duration,
        type: file.type
      };
      setFileInfo(info);

      // Simulate upload progress
      await simulateUploadProgress();
      
      // Start processing
      setIsUploading(false);
      setIsProcessing(true);

      // Create FileReader for base64 conversion
      const reader = new FileReader();
      reader.onload = async (e) => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const result = e.target?.result as string;
        onChange(result);
        setIsProcessing(false);
        
        toast({
          title: 'Video uploaded successfully',
          description: `${info.name} (${formatFileSize(info.size)}) is ready`,
        });
      };
      
      reader.onerror = () => {
        setUploadError('Failed to process video file');
        setIsProcessing(false);
        setIsUploading(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload video. Please try again.');
      setIsUploading(false);
      setIsProcessing(false);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload video. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRetry = () => {
    setUploadError(null);
    setUploadProgress(0);
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {value ? (
        <div className="relative">
          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              src={value}
              className="w-full h-full object-cover"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              muted
              loop={false}
            />
            
            {/* Play/Pause Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="lg"
                onClick={togglePlayPause}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8" />
                )}
              </Button>
            </div>

            {/* Success indicator */}
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                <CheckCircle className="h-3 w-3" />
                Ready
              </div>
            </div>
          </div>

          {/* File Information */}
          {fileInfo && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <div>
                  <span className="font-medium">Name:</span> {fileInfo.name}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {formatFileSize(fileInfo.size)}
                </div>
                {fileInfo.duration && (
                  <div>
                    <span className="font-medium">Duration:</span> {formatDuration(fileInfo.duration)}
                  </div>
                )}
                <div>
                  <span className="font-medium">Type:</span> {fileInfo.type}
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Replace Video
            </Button>
            
            {onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700"
                disabled={isUploading || isProcessing}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <div className="space-y-4">
            {/* Upload Error */}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Upload Error</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{uploadError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Try Again
                </Button>
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-600">
                    Uploading... {Math.round(uploadProgress)}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                {fileInfo && (
                  <p className="text-xs text-gray-500">
                    {fileInfo.name} ({formatFileSize(fileInfo.size)})
                  </p>
                )}
              </div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-orange-600 animate-spin" />
                  <span className="text-sm font-medium text-orange-600">
                    Processing video...
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Optimizing video for web playback
                </p>
              </div>
            )}

            {/* Upload Interface */}
            {!isUploading && !isProcessing && !uploadError && (
              <>
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Video className="h-8 w-8 text-gray-400" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Upload Video Banner</h3>
                  <p className="text-sm text-gray-500">
                    Choose a video file to create an engaging banner
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    MP4, WebM, MOV up to 50MB
                  </p>
                </div>

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-champagne text-navy hover:bg-champagne/90"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select Video
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}