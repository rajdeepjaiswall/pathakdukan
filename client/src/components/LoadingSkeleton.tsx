import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  type?: 'product' | 'banner' | 'category' | 'text' | 'showcase';
}

export default function LoadingSkeleton({ 
  className, 
  count = 1, 
  type = 'product' 
}: LoadingSkeletonProps) {
  const getSkeletonContent = () => {
    switch (type) {
      case 'product':
        return (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-200 h-48 animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-200 h-4 rounded animate-pulse"></div>
              <div className="bg-gray-200 h-3 rounded w-2/3 animate-pulse"></div>
              <div className="flex justify-between items-center">
                <div className="bg-gray-200 h-4 rounded w-16 animate-pulse"></div>
                <div className="bg-gray-200 h-8 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
        );
        
      case 'banner':
        return (
          <div className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
        );
        
      case 'category':
        return (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="bg-gray-200 w-16 h-16 rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="bg-gray-200 h-4 rounded animate-pulse"></div>
          </div>
        );
        
      case 'text':
        return (
          <div className="space-y-2">
            <div className="bg-gray-200 h-4 rounded animate-pulse"></div>
            <div className="bg-gray-200 h-4 rounded w-3/4 animate-pulse"></div>
          </div>
        );
        
      case 'showcase':
        return (
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex-shrink-0 w-64 md:w-72">
                <div 
                  className="bg-gray-200 rounded-lg animate-pulse"
                  style={{ aspectRatio: '1 / 1.414' }}
                />
              </div>
            ))}
          </div>
        );
        
      default:
        return (
          <div className="bg-gray-200 h-20 rounded animate-pulse"></div>
        );
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {getSkeletonContent()}
        </div>
      ))}
    </div>
  );
}