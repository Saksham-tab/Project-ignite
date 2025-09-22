import React from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/currency';
import QuantityButton from './QuantityButton';
import RemoveButton from './RemoveButton';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDropdown: React.FC<CartDropdownProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-deep-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Cart Dropdown */}
      <div className="fixed top-0 right-0 h-full w-96 bg-deep-black border-l border-ritual-red/20 z-50 transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ritual-red/20">
          <h2 className="font-cinzel text-xl text-antique-gold">Your Cart</h2>        <button
          onClick={onClose}
          className="p-2 hover:text-ritual-red transition-colors"
          aria-label="Close cart"
          title="Close cart"
        >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="font-cormorant text-gray-400 mb-2">Your cart is empty</p>
              <p className="font-cormorant text-sm text-gray-500">Discover our sacred collection</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-ash-gray/20 rounded-lg">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />                  <div className="flex-1">
                    <h3 className="font-cormorant text-white text-sm">{item.name}</h3>
                    <p className="font-cinzel text-ritual-red text-sm">{formatPrice(item.price)}</p>
                      {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 mt-2">
                      <QuantityButton
                        quantity={item.quantity}
                        onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                        onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                        size="sm"
                      />
                      <RemoveButton
                        onRemove={() => removeItem(item.id)}
                        size="sm"
                        className="ml-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-ritual-red/20 p-6">            <div className="flex justify-between items-center mb-4">
              <span className="font-cormorant text-lg text-gray-300">Total:</span>
              <span className="font-cinzel text-xl text-antique-gold">{formatPrice(total)}</span>
            </div>
            <div className="space-y-3">
              <Link
                to="/cart"
                onClick={onClose}
                className="block w-full py-3 bg-ash-gray/50 text-center font-cormorant text-white border border-ritual-red/30 rounded hover:bg-ash-gray/70 transition-colors"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                onClick={onClose}
                className="block w-full py-3 bg-ritual-red text-center font-cormorant text-white rounded hover:bg-blood-red transition-colors"
              >
                Checkout ({itemCount} items)
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDropdown;
