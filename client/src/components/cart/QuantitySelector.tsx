import { Minus, Plus } from 'lucide-react';

interface QuantitySelectorProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disabled?: boolean;
  isCompact?: boolean;
}

export default function QuantitySelector({
  quantity,
  onDecrease,
  onIncrease,
  disabled = false,
  isCompact = false,
}: QuantitySelectorProps) {
  return (
    <div
      className={`flex items-center bg-gray-50 rounded-full border border-gray-200 overflow-hidden ${isCompact ? 'scale-90 origin-left' : ''}`}
    >
      <button
        onClick={onDecrease}
        disabled={disabled || quantity <= 1}
        className={`flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-40 ${isCompact ? 'w-8 h-8' : 'w-9 h-9'}`}
        aria-label="Decrease quantity"
      >
        <Minus className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      </button>
      <span
        className={`text-center font-semibold text-gray-900 select-none ${isCompact ? 'w-7 text-xs' : 'w-9 text-sm'}`}
      >
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        disabled={disabled}
        className={`flex items-center justify-center bg-[#9B2335] text-white hover:bg-[#7a1c2a] active:bg-[#5a1520] transition-colors duration-200 disabled:opacity-50 ${isCompact ? 'w-8 h-8' : 'w-9 h-9'}`}
        aria-label="Increase quantity"
      >
        <Plus className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      </button>
    </div>
  );
}
