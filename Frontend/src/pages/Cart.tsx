import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/currency';
import QuantityButton from '../components/QuantityButton';
import RemoveButton from '../components/RemoveButton';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeItem, total, itemCount, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="text-center py-20">
            <ShoppingBag size={64} className="mx-auto text-gray-600 mb-6" />
            <h1 className="font-cinzel text-3xl text-antique-gold mb-4">Your Cart is Empty</h1>
            <p className="font-cormorant text-gray-400 mb-8 max-w-md mx-auto">
              Your spiritual journey awaits. Discover our sacred collection and ignite your transformation.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 bg-ritual-red hover:bg-blood-red text-white px-8 py-3 rounded font-cormorant transition-colors duration-300"
            >
              <ArrowLeft size={16} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-cinzel text-3xl md:text-4xl text-antique-gold mb-2">
              Your Sacred Cart
            </h1>
            <p className="font-cormorant text-gray-400">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your collection
            </p>
          </div>
          <Link
            to="/shop"
            className="flex items-center space-x-2 text-gray-400 hover:text-ritual-red transition-colors font-cormorant"
          >
            <ArrowLeft size={16} />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-ash-gray/20 rounded-lg p-6 border border-ritual-red/20">
                  <div className="flex items-start space-x-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">                      <h3 className="font-cinzel text-xl text-antique-gold mb-2">{item.name}</h3>
                      <p className="font-cormorant text-ritual-red text-lg mb-4">{formatPrice(item.price)}</p>
                      
                      <div className="flex items-center justify-between">                        {/* Quantity Controls */}
                        <QuantityButton
                          quantity={item.quantity}
                          onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                          onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                        />

                        {/* Remove Button */}
                        <RemoveButton onRemove={() => removeItem(item.id)} />
                      </div>

                      {/* Item Total */}
                      <div className="mt-4 pt-4 border-t border-ritual-red/20">                        <div className="flex justify-between items-center">
                          <span className="font-cormorant text-gray-400">Subtotal:</span>
                          <span className="font-cinzel text-antique-gold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart */}
            <div className="mt-6 text-center">
              <button
                onClick={clearCart}
                className="text-gray-500 hover:text-ritual-red transition-colors font-cormorant"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-ash-gray/20 rounded-lg p-6 border border-ritual-red/20 sticky top-24">
              <h2 className="font-cinzel text-xl text-antique-gold mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="font-cormorant text-gray-400">Subtotal:</span>
                  <span className="font-cormorant text-white">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-cormorant text-gray-400">Shipping:</span>
                  <span className="font-cormorant text-white">
                    {total >= 100 ? 'Free' : formatPrice(10)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-cormorant text-gray-400">Tax:</span>
                  <span className="font-cormorant text-white">{formatPrice(total * 0.08)}</span>
                </div>
                <div className="border-t border-ritual-red/20 pt-4">
                  <div className="flex justify-between">
                    <span className="font-cinzel text-lg text-antique-gold">Total:</span>
                    <span className="font-cinzel text-xl text-antique-gold">
                      {formatPrice(total + (total >= 100 ? 0 : 10) + (total * 0.08))}
                    </span>
                  </div>
                </div>
              </div>

              {total < 100 && (
                <div className="mb-6 p-3 bg-ritual-red/10 border border-ritual-red/20 rounded">
                  <p className="font-cormorant text-sm text-gray-300">
                    Add {formatPrice(100 - total)} more for free shipping
                  </p>
                </div>
              )}

              <Link
                to="/checkout"
                className="block w-full bg-ritual-red hover:bg-blood-red text-white text-center py-3 rounded font-cormorant text-lg transition-colors duration-300"
              >
                Proceed to Checkout
              </Link>

              <div className="mt-4 text-center">
                <p className="font-cormorant text-xs text-gray-500">
                  Secure checkout powered by Stripe & Razorpay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
