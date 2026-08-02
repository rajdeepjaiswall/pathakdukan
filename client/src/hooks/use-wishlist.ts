import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const apiRequest = async (url: string, options?: RequestInit) => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // send session cookies for Google OAuth users
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
};

export function useWishlist() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['/api/wishlist'],
    queryFn: () => apiRequest('/api/wishlist'),
    retry: false,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: (productId: number) => 
      apiRequest('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: 'Added to wishlist',
        description: 'Product has been added to your wishlist.',
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('login') || error.message.includes('Unauthorized')) {
        toast({
          title: 'Login Required',
          description: 'Please login to add items to your wishlist.',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (productId: number) => 
      apiRequest(`/api/wishlist/${productId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: 'Removed from wishlist',
        description: 'Product has been removed from your wishlist.',
      });
    },
    onError: (error: Error) => {
      if (error.message.includes('login') || error.message.includes('Unauthorized')) {
        toast({
          title: 'Login Required',
          description: 'Please login to manage your wishlist.',
          variant: 'destructive',
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  const isInWishlist = (productId: number) => {
    return wishlistItems.some((item: any) => item.product_id === productId);
  };

  const toggleWishlist = (productId: number) => {
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return {
    wishlistItems,
    isLoading,
    isInWishlist,
    toggleWishlist,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    isAdding: addToWishlistMutation.isPending,
    isRemoving: removeFromWishlistMutation.isPending,
  };
}