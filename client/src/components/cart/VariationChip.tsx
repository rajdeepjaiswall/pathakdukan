interface VariationChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function VariationChip({
  label,
  isActive,
  onClick,
  disabled = false,
}: VariationChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-full text-xs font-semibold
        transition-all duration-200 ease-out
        border whitespace-nowrap
        ${
          isActive
            ? 'bg-[#9B2335] text-white border-[#9B2335] shadow-sm'
            : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
      `}
    >
      {label}
    </button>
  );
}
