import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import SimpleCheckout from '../components/SimpleCheckout';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items } = useCart();
  const [orderComplete, setOrderComplete] = useState(false);

  const handleSuccess = () => {
    setOrderComplete(true);
  };

  const handleCancel = () => {
    navigate('/cart');
  };

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="text-center py-20">
            <h1 className="font-cinzel text-3xl text-antique-gold mb-4">Your Cart is Empty</h1>
            <p className="font-cormorant text-gray-400 mb-8">
              Add some items to your cart before checkout.
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

  if (orderComplete) {
    return (
      <div className="min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-16 h-16 bg-ritual-red rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-cinzel text-3xl text-antique-gold mb-4">Order Placed!</h1>
            <p className="font-cormorant text-gray-400 mb-8">
              Thank you for your order. You will receive a confirmation shortly.
            </p>
            <div className="space-y-4">
              <Link
                to="/track"
                className="block bg-ritual-red hover:bg-blood-red text-white px-8 py-3 rounded font-cormorant transition-colors duration-300"
              >
                Track Your Order
              </Link>
              <Link
                to="/shop"
                className="block bg-ash-gray/50 hover:bg-ash-gray/70 text-white px-8 py-3 rounded font-cormorant transition-colors duration-300"
              >
                Continue Shopping
              </Link>
            </div>
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
              Secure Checkout
            </h1>
            <p className="font-cormorant text-gray-400">
              Complete your spiritual transformation
            </p>
          </div>
          <Link
            to="/cart"
            className="flex items-center space-x-2 text-gray-400 hover:text-ritual-red transition-colors font-cormorant"
          >
            <ArrowLeft size={16} />
            <span>Back to Cart</span>
          </Link>
        </div>

        {/* Checkout Component */}
        <div className="flex justify-center">
          <SimpleCheckout onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
      </div>
    </div>
  );
};

export default Checkout;
