import React, { useState } from 'react';
import { CreditCard, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { paymentService } from '../services';
import { formatPrice } from '../utils/currency';

interface SimpleCheckoutProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const SimpleCheckout: React.FC<SimpleCheckoutProps> = ({ onSuccess, onCancel }) => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCODModal, setShowCODModal] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: user?.firstName || '',
    email: user?.email || '',
    phone: '',
    address: ''
  });

  const shipping = total >= 100 ? 0 : 10;
  const tax = total * 0.08;
  const finalTotal = total + shipping + tax;

  const handlePayOnline = async () => {
    setIsProcessing(true);
    try {
      // Create Razorpay order
      const orderData = {
        userId: user?.id,
        items,
        amount: finalTotal,
        userInfo
      };

      const response = await paymentService.createRazorpayOrder(finalTotal, orderData);
      
      // Redirect to Razorpay hosted checkout
      const options = {
        key: response.data.key,
        order_id: response.data.razorpayOrderId,
        name: "Ignite Spiritual Store",
        description: "Sacred Items Purchase",
        redirect: true,
        callback_url: `${window.location.origin}/payment-success`,
        prefill: {
          name: userInfo.name,
          email: userInfo.email,
          contact: userInfo.phone
        },
        theme: {
          color: '#8B0000'
        }
      };

      // @ts-ignore - Razorpay global variable
      if (window.Razorpay) {
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCODConfirm = async () => {
    setIsProcessing(true);
    try {
      // Create COD order
      const orderData = {
        userId: user?.id,
        items,
        amount: finalTotal,
        userInfo
      };

      await paymentService.createCODOrder(orderData);
      
      // Clear cart and show success
      clearCart();
      setShowCODModal(false);
      onSuccess();
    } catch (error) {
      console.error('COD order error:', error);
      alert('Failed to place COD order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUserInfo({
      ...userInfo,
      [e.target.name]: e.target.value
    });
  };

  const isFormValid = userInfo.name && userInfo.email && userInfo.phone && userInfo.address;

  return (
    <div className="max-w-md mx-auto bg-ash-gray/20 rounded-lg p-6 border border-ritual-red/20">
      <h2 className="font-cinzel text-2xl text-antique-gold mb-6 text-center">
        Complete Your Order
      </h2>

      {/* User Information Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block font-cormorant text-gray-300 mb-2">Full Name *</label>
          <input
            type="text"
            name="name"
            value={userInfo.name}
            onChange={handleInputChange}
            required
            className="w-full bg-ash-gray/50 border border-ritual-red/30 rounded px-4 py-2 text-white focus:outline-none focus:border-ritual-red"
            placeholder="Enter your full name"
          />
        </div>
        
        <div>
          <label className="block font-cormorant text-gray-300 mb-2">Email *</label>
          <input
            type="email"
            name="email"
            value={userInfo.email}
            onChange={handleInputChange}
            required
            className="w-full bg-ash-gray/50 border border-ritual-red/30 rounded px-4 py-2 text-white focus:outline-none focus:border-ritual-red"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label className="block font-cormorant text-gray-300 mb-2">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={userInfo.phone}
            onChange={handleInputChange}
            required
            className="w-full bg-ash-gray/50 border border-ritual-red/30 rounded px-4 py-2 text-white focus:outline-none focus:border-ritual-red"
            placeholder="Enter your phone number"
          />
        </div>
        
        <div>
          <label className="block font-cormorant text-gray-300 mb-2">Address *</label>
          <textarea
            name="address"
            value={userInfo.address}
            onChange={handleInputChange}
            required
            rows={3}
            className="w-full bg-ash-gray/50 border border-ritual-red/30 rounded px-4 py-2 text-white focus:outline-none focus:border-ritual-red"
            placeholder="Enter your complete address"
          />
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-deep-black/30 rounded-lg p-4 mb-6">
        <h3 className="font-cormorant text-lg text-gray-300 mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal:</span>
            <span className="text-white">{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Shipping:</span>
            <span className="text-white">{shipping === 0 ? 'free' : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tax:</span>
            <span className="text-white">{formatPrice(tax)}</span>
          </div>
          <div className="border-t border-ritual-red/20 pt-2">
            <div className="flex justify-between font-cormorant text-lg">
              <span className="text-antique-gold">Total:</span>
              <span className="text-antique-gold">{formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="space-y-3 mb-6">
        <button
          onClick={handlePayOnline}
          disabled={!isFormValid || isProcessing}
          className="w-full bg-ritual-red hover:bg-blood-red disabled:bg-gray-600 text-white py-3 rounded font-cormorant text-lg transition-colors duration-300 flex items-center justify-center space-x-2"
        >
          <CreditCard size={20} />
          <span>Pay Online</span>
        </button>
        
        <div className="text-center">
          <span className="font-cormorant text-gray-400 text-sm">or</span>
        </div>
        
        <button
          onClick={() => setShowCODModal(true)}
          disabled={!isFormValid || isProcessing}
          className="w-full bg-ash-gray/50 hover:bg-ash-gray/70 disabled:bg-gray-600 text-white py-3 rounded font-cormorant text-lg transition-colors duration-300 flex items-center justify-center space-x-2"
        >
          <Truck size={20} />
          <span>Cash on Delivery</span>
        </button>
      </div>

      <button
        onClick={onCancel}
        className="w-full text-gray-400 hover:text-white transition-colors font-cormorant"
      >
        Cancel
      </button>

      {/* COD Confirmation Modal */}
      {showCODModal && (
        <div className="fixed inset-0 bg-deep-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ash-gray/95 rounded-lg border border-ritual-red/30 p-6 w-full max-w-sm">
            <h3 className="font-cinzel text-xl text-antique-gold mb-4 text-center">
              Confirm Cash on Delivery
            </h3>
            <p className="font-cormorant text-gray-300 mb-6 text-center">
              You will pay {formatPrice(finalTotal)} when your order is delivered.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCODConfirm}
                disabled={isProcessing}
                className="flex-1 bg-ritual-red hover:bg-blood-red disabled:bg-gray-600 text-white py-2 rounded font-cormorant transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Confirm Order'}
              </button>
              <button
                onClick={() => setShowCODModal(false)}
                disabled={isProcessing}
                className="flex-1 bg-ash-gray/50 hover:bg-ash-gray/70 text-white py-2 rounded font-cormorant transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleCheckout;
