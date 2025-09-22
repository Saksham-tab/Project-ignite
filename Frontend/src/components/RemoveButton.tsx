import React from 'react';
import { X } from 'lucide-react';

interface RemoveButtonProps {
  onRemove: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

const RemoveButton: React.FC<RemoveButtonProps> = ({
  onRemove,
  size = 'md',
  className = ''
}) => {
  const buttonSize = size === 'sm' ? 'p-1' : 'p-2';
  const iconSize = size === 'sm' ? 14 : 20;

  return (
    <button
      onClick={onRemove}
      className={`${buttonSize} text-gray-500 hover:text-ritual-red transition-colors ${className}`}
      aria-label="Remove item"
      title="Remove item"
    >
      <X size={iconSize} />
    </button>
  );
};

export default RemoveButton;
