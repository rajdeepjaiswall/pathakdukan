import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CartItem, CartSummary, calculateCartSummary } from '../lib/cart';
import { apiRequest } from '../lib/queryClient';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { useCharges } from './use-charges';

interface CartContextType {
  items: CartItem[];
  summary: CartSummary;
  isLoading: boolean;
  addToCart: (productId: number, quantity: number, selectedWeight?: string, variantPrice?: number) => void;
  updateQuantity: (cartItemId: number, quantity: number) => void;
  removeFromCart: (cartItemId: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  lastAddedItem: { id: number; name: string; image?: string } | null;
  clearLastAddedItem: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<{ id: number; name: string; image?: string } | null>(null);

  // Fetch cart items
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['/api/cart'],
    enabled: isAuthenticated,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['/api/products'],
  });

  // Live delivery + handling charges (admin-configurable, applied as a separate layer)
  const { charges } = useCharges();

  const items = (cartData as CartItem[]) || [];
  // Calculate cart summary (subtotal + GST + delivery + handling)
  const summary = calculateCartSummary(items, charges);

  const clearLastAddedItem = () => setLastAddedItem(null);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity, selectedWeight, variantPrice }: { productId: number; quantity: number; selectedWeight?: string; variantPrice?: number }) => {
      return await apiRequest('POST', '/api/cart', {
        product_id: productId,
        quantity,
        ...(selectedWeight ? { selectedWeight } : {}),
        ...(variantPrice !== undefined ? { variantPrice: variantPrice.toString() } : {}),
      });
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      
      const product = (products as any[]).find(p => p.id === productId);
      if (product) {
        setLastAddedItem({
          id: productId,
          name: product.name,
          image: product.images?.[0] || product.image_url
        });
      }

      toast({
        title: 'Added to cart',
        description: 'Item has been added to your cart',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item to cart',
        variant: 'destructive',
      });
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      return await apiRequest('PUT', `/api/cart/${cartItemId}`, {
        quantity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update cart',
        variant: 'destructive',
      });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      return await apiRequest('DELETE', `/api/cart/${cartItemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Removed from cart',
        description: 'Item has been removed from your cart',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item from cart',
        variant: 'destructive',
      });
    },
  });

  const addToCart = (productId: number, quantity: number, selectedWeight?: string, variantPrice?: number) => {
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please login to add items to your cart. Redirecting...',
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.assign('https://www.pathakbhandar.in/login');
      }, 1500);
      return;
    }
    addToCartMutation.mutate({ productId, quantity, selectedWeight, variantPrice });
  };

  const updateQuantity = (cartItemId: number, quantity: number) => {
    updateQuantityMutation.mutate({ cartItemId, quantity });
  };

  const removeFromCart = (cartItemId: number) => {
    removeFromCartMutation.mutate(cartItemId);
  };

  const clearCart = () => {
    items.forEach(item => removeFromCart(item.id));
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  const value = {
    items,
    summary,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isOpen,
    openCart,
    closeCart,
    lastAddedItem,
    clearLastAddedItem,
  };

  return React.createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
