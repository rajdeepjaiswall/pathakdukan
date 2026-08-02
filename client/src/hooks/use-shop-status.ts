import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export interface ShopStatus {
  isOpen: boolean;
  nextOpenTime: string | null;
}

export function useShopStatus() {
  return useQuery<ShopStatus>({
    queryKey: ['/api/shop-status'],
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useCountdown(targetISO: string | null | undefined): string {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!targetISO) {
      setDisplay('');
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Date.parse(targetISO) - Date.now());
      if (diff === 0) {
        setDisplay('');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) {
        setDisplay(`${h}h ${m}m ${s}s`);
      } else if (m > 0) {
        setDisplay(`${m}m ${s}s`);
      } else {
        setDisplay(`${s}s`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetISO]);

  return display;
}
