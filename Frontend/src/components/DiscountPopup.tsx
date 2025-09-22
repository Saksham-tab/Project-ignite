import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';

interface DiscountPopupProps {
  onClose: () => void;
}

const DiscountPopup: React.FC<DiscountPopupProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(popupRef.current,
      { opacity: 0, scale: 0.8, rotationY: 180 },
      { opacity: 1, scale: 1, rotationY: 0, duration: 0.8, ease: 'back.out(1.7)' }
    );
    sessionStorage.setItem('discountPopupSeen', 'true');
  }, []);

  const handleClose = () => {
    gsap.to(popupRef.current, {
      opacity: 0,
      scale: 0.8,
      rotationY: -180,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: onClose
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    localStorage.setItem('ignite_discount_subscriber', JSON.stringify({ email, phone }));
    setIsSubmitted(true);
    setTimeout(handleClose, 3000);
  };

  return (
    <div className="fixed inset-0 bg-deep-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div ref={popupRef} className="relative text-center max-w-md w-full px-4">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-ritual-red transition-colors z-10"
        >
          <X size={24} />
        </button>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <h2 className="font-cinzel text-2xl text-antique-gold mb-2">
              Sacred Offering
            </h2>
            <p className="font-cormorant text-lg text-gray-300 mb-6">
              The Circle rewards the faithful
            </p>

            {/* Offer */}
            <div className="mb-6">
              <div className="font-cinzel text-3xl text-ritual-red mb-2">15% OFF</div>
              <p className="font-cormorant text-gray-300">
                Your first ritual purchase
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-deep-black/50 border border-ritual-red/30 rounded text-white placeholder-gray-400 font-cormorant focus:outline-none focus:border-ritual-red transition-colors"
                required
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-deep-black/50 border border-ritual-red/30 rounded text-white placeholder-gray-400 font-cormorant focus:outline-none focus:border-ritual-red transition-colors"
              />
              <button
                type="submit"
                className="w-full py-3 bg-ritual-red text-white font-cormorant text-lg hover:bg-blood-red transition-colors duration-300 rounded"
              >
                Claim Sacred Discount
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4 font-cormorant">
              Join the Circle and receive exclusive offers
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="font-cinzel text-xl text-antique-gold mb-2">
              Blessing Received
            </h3>
            <p className="font-cormorant text-gray-300 mb-4">
              Check your email for the sacred discount code
            </p>
            <div className="text-ritual-red font-cinzel text-lg">
              IGNITE15
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscountPopup;
