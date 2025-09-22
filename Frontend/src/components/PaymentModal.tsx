import React, { useState, useEffect } from 'react';
import { X, QrCode, CreditCard, Smartphone, IndianRupee } from 'lucide-react';
import { paymentService } from '../services';
import { formatPrice } from '../utils/currency';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId?: string;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  orderId,
  onSuccess
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedMethod('');
      setQrCodeUrl('');
      setError('');
    }
  }, [isOpen]);

  const handleQRPayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await paymentService.createQRPayment(amount, orderId);
      setQrCodeUrl(response.data.qr_code_url);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 30000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardPayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await paymentService.redirectToCardPayment(amount, orderId);
      window.location.href = response.redirect_url;
    } catch (err: any) {
      setError(err.message || 'Failed to redirect to payment');
      setIsLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const orderResponse = await paymentService.createRazorpayOrder(amount, orderId);
      const options = {
        key: orderResponse.data.key,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: 'Ignite Spiritual Store',
        description: 'Sacred Items Purchase',
        order_id: orderResponse.data.razorpayOrderId,
        handler: async (response: any) => {
          try {
            await paymentService.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderResponse.data.razorpayOrderId
            });
            onSuccess();
            onClose();
          } catch (error) {
            setError('Payment verification failed');
          }
        },
        prefill: {
          name: 'Customer',
          email: 'customer@example.com',
          contact: '+919876543210'
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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayUPayment = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await paymentService.createPayURequest(amount, orderId);
      if (response && response.redirect_url) {
        window.location.href = response.redirect_url;
      } else {
        throw new Error('Failed to get PayU payment URL');
      }
    } catch (err: any) {
      setError(err.message || 'PayU initialization failed');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-deep-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ash-gray/95 rounded-lg border border-ritual-red/30 p-8 w-full max-w-md relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-ritual-red transition-colors"
          aria-label="Close payment modal"
          title="Close"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="font-cinzel text-3xl text-antique-gold mb-2">
            Complete Payment
          </h2>
          <p className="font-cormorant text-gray-300 mb-4">
            Total Amount: {formatPrice(amount)}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        {!selectedMethod ? (
          <div className="space-y-4">
            <h3 className="font-cormorant text-lg text-gray-300 mb-4">Choose Payment Method:</h3>

            <button
              onClick={() => setSelectedMethod('qr')}
              className="w-full p-4 bg-deep-black/50 border border-ritual-red/30 rounded-lg hover:border-ritual-red transition-colors flex items-center space-x-3"
            >
              <QrCode className="text-antique-gold" size={24} />
              <div className="text-left">
                <div className="font-cormorant text-white">QR Code / UPI</div>
                <div className="font-cormorant text-sm text-gray-400">Pay using any UPI app</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod('card')}
              className="w-full p-4 bg-deep-black/50 border border-ritual-red/30 rounded-lg hover:border-ritual-red transition-colors flex items-center space-x-3"
            >
              <CreditCard className="text-antique-gold" size={24} />
              <div className="text-left">
                <div className="font-cormorant text-white">Debit/Credit Card</div>
                <div className="font-cormorant text-sm text-gray-400">Secure card payment</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod('razorpay')}
              className="w-full p-4 bg-deep-black/50 border border-ritual-red/30 rounded-lg hover:border-ritual-red transition-colors flex items-center space-x-3"
            >
              <Smartphone className="text-antique-gold" size={24} />
              <div className="text-left">
                <div className="font-cormorant text-white">Razorpay</div>
                <div className="font-cormorant text-sm text-gray-400">All payment options</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedMethod('payu')}
              className="w-full p-4 bg-deep-black/50 border border-ritual-red/30 rounded-lg hover:border-ritual-red transition-colors flex items-center space-x-3"
            >
              <IndianRupee className="text-antique-gold" size={24} />
              <div className="text-left">
                <div className="font-cormorant text-white">PayU</div>
                <div className="font-cormorant text-sm text-gray-400">Pay with card, UPI, netbanking</div>
              </div>
            </button>
          </div>
        ) : selectedMethod === 'qr' && !qrCodeUrl ? (
          <div className="text-center">
            <button
              onClick={handleQRPayment}
              disabled={isLoading}
              className="w-full bg-ritual-red hover:bg-blood-red text-white py-3 rounded font-cormorant text-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Generating QR Code...' : 'Generate QR Code'}
            </button>
          </div>
        ) : selectedMethod === 'qr' && qrCodeUrl ? (
          <div className="text-center">
            <div className="mb-4 p-4 bg-white rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`}
                alt="Payment QR Code"
                className="mx-auto"
              />
            </div>
            <p className="font-cormorant text-gray-300 mb-4">
              Scan this QR code with any UPI app to complete payment
            </p>
            <p className="font-cormorant text-sm text-gray-400">
              Payment will be verified automatically
            </p>
          </div>
        ) : selectedMethod === 'card' ? (
          <div className="text-center">
            <button
              onClick={handleCardPayment}
              disabled={isLoading}
              className="w-full bg-ritual-red hover:bg-blood-red text-white py-3 rounded font-cormorant text-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Redirecting...' : 'Proceed to Card Payment'}
            </button>
          </div>
        ) : selectedMethod === 'razorpay' ? (
          <div className="text-center">
            <button
              onClick={handleRazorpayPayment}
              disabled={isLoading}
              className="w-full bg-ritual-red hover:bg-blood-red text-white py-3 rounded font-cormorant text-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Opening Razorpay...' : 'Pay Now'}
            </button>
          </div>
        ) : selectedMethod === 'payu' ? (
          <div className="text-center">
            <button
              onClick={handlePayUPayment}
              disabled={isLoading}
              className="w-full bg-ritual-red hover:bg-blood-red text-white py-3 rounded font-cormorant text-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Redirecting to PayU...' : 'Proceed with PayU'}
            </button>
          </div>
        ) : null}

        {selectedMethod && (
          <button
            onClick={() => setSelectedMethod('')}
            className="mt-4 w-full text-gray-400 hover:text-white transition-colors font-cormorant"
          >
            ← Back to payment methods
          </button>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
