import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { paymentService } from '../services';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // Get payment details from URL parameters
        const paymentId = searchParams.get('razorpay_payment_id');
        const orderId = searchParams.get('razorpay_order_id');
        const signature = searchParams.get('razorpay_signature');

        if (!paymentId || !orderId) {
          setStatus('failed');
          setMessage('Payment information is missing. Please contact support.');
          return;
        }

        // Confirm payment with backend
        const response = await paymentService.confirmRazorpayPayment({
          payment_id: paymentId,
          order_id: orderId,
          signature: signature || ''
        });

        if (response.success) {
          setStatus('success');
          setMessage('Your payment has been processed successfully!');
          
          // Clear cart from localStorage if needed
          localStorage.removeItem('cart');
        } else {
          setStatus('failed');
          setMessage('Payment verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('Payment confirmation error:', error);
        setStatus('failed');
        setMessage('An error occurred while processing your payment. Please contact support.');
      }
    };

    handlePaymentCallback();
  }, [searchParams]);

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <Clock size={64} className="text-antique-gold animate-pulse" />;
      case 'success':
        return <CheckCircle size={64} className="text-green-500" />;
      case 'failed':
        return <XCircle size={64} className="text-red-500" />;
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <h1 className="font-cinzel text-3xl text-antique-gold mb-4">
              Processing Payment...
            </h1>
            <p className="font-cormorant text-gray-400 mb-8">
              Please wait while we confirm your payment.
            </p>
          </>
        );
      case 'success':
        return (
          <>
            <h1 className="font-cinzel text-3xl text-green-500 mb-4">
              Payment Successful!
            </h1>
            <p className="font-cormorant text-gray-400 mb-8">
              {message}
            </p>
            <p className="font-cormorant text-gray-400 mb-8">
              Thank you for your order. You will receive a confirmation email shortly.
            </p>
            <div className="space-y-4">
              <Link
                to="/track"
                className="block bg-ritual-red hover:bg-blood-red text-white px-8 py-3 rounded font-cormorant transition-colors duration-300 text-center"
              >
                Track Your Order
              </Link>
              <Link
                to="/shop"
                className="block bg-ash-gray/50 hover:bg-ash-gray/70 text-white px-8 py-3 rounded font-cormorant transition-colors duration-300 text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        );
      case 'failed':
        return (
          <>
            <h1 className="font-cinzel text-3xl text-red-500 mb-4">
              Payment Failed
            </h1>
            <p className="font-cormorant text-gray-400 mb-8">
              {message}
            </p>
            <div className="space-y-4">
              <Link
                to="/cart"
                className="block bg-ritual-red hover:bg-blood-red text-white px-8 py-3 rounded font-cormorant transition-colors duration-300 text-center"
              >
                Try Again
              </Link>
              <Link
                to="/shop"
                className="block bg-ash-gray/50 hover:bg-ash-gray/70 text-white px-8 py-3 rounded font-cormorant transition-colors duration-300 text-center"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="container mx-auto px-6">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="mb-8">
            {renderIcon()}
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
