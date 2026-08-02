import { useQuery } from '@tanstack/react-query';
import type { ChargesConfig } from '@shared/schema';

/**
 * Live delivery + handling charges config (public endpoint).
 * Drives cart/checkout/popup pricing. Returns `undefined` while loading so callers
 * can treat charges as "not yet applied" (the cart layer falls back to no charges).
 */
export function useCharges() {
  const { data: charges, isLoading } = useQuery<ChargesConfig>({
    queryKey: ['/api/charges'],
    staleTime: 60 * 1000,
  });
  return { charges, isLoading };
}
