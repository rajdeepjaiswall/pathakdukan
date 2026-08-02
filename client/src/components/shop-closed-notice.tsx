import { Clock } from 'lucide-react';
import { useShopStatus, useCountdown } from '@/hooks/use-shop-status';

interface ShopClosedNoticeProps {
  variant?: 'checkout' | 'confirmation' | 'orders';
}

export function ShopClosedNotice({ variant = 'checkout' }: ShopClosedNoticeProps) {
  const { data: shopStatus } = useShopStatus();
  const countdown = useCountdown(shopStatus?.nextOpenTime);

  if (!shopStatus || shopStatus.isOpen) return null;

  if (variant === 'checkout') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          We are closed for now but we will process your order
          {countdown ? (
            <> in <strong className="font-semibold">{countdown}</strong></>
          ) : (
            ' when we reopen'
          )}.
        </p>
      </div>
    );
  }

  if (variant === 'confirmation') {
    return (
      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm font-medium text-amber-800 leading-relaxed">
          Uh no, we are closed for now but as soon as we are back we will process your order.
          If you wish to cancel, go ahead, but we will be back in{' '}
          {countdown ? <strong className="font-semibold">{countdown}</strong> : 'a little while'}.
        </p>
        <p className="text-xs text-amber-600 mt-2">
          Refunds will be processed within 15 minutes to 4 working days.
        </p>
      </div>
    );
  }

  if (variant === 'orders') {
    return (
      <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Shop is currently closed</p>
          <p className="text-sm text-amber-700">
            New orders will be processed when we reopen
            {countdown ? (
              <> in <strong className="font-semibold">{countdown}</strong></>
            ) : ''}.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
