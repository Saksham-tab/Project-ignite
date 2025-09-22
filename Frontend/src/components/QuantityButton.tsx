import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface QuantityButtonProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const QuantityButton: React.FC<QuantityButtonProps> = ({
  quantity,
  onIncrease,
  onDecrease,
  disabled = false,
  size = 'md'
}) => {
  const buttonSize = size === 'sm' ? 'p-1' : 'p-2';
  const iconSize = size === 'sm' ? 14 : 16;
  const textSize = size === 'sm' ? 'text-sm w-8' : 'text-lg w-12';

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={onDecrease}
        className={`${buttonSize} bg-ash-gray/50 hover:bg-ritual-red/20 rounded border border-ritual-red/30 transition-colors`}
        disabled={quantity <= 1 || disabled}
        aria-label="Decrease quantity"
        title="Decrease quantity"
      >
        <Minus size={iconSize} />
      </button>
      <span className={`text-white font-cormorant ${textSize} text-center`}>
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        className={`${buttonSize} bg-ash-gray/50 hover:bg-ritual-red/20 rounded border border-ritual-red/30 transition-colors`}
        disabled={disabled}
        aria-label="Increase quantity"
        title="Increase quantity"
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
};

export default QuantityButton;
