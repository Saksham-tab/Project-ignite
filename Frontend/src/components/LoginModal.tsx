import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { gsap } from 'gsap';
import { useAuth } from '../context/AuthContext';
import OtpVerification from './OtpVerification';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    dateOfBirth: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { login, signup, isLoading, pendingVerificationUser } = useAuth();

  useEffect(() => {
    // Animate modal entrance
    gsap.fromTo(modalRef.current,
      { opacity: 0, scale: 0.8, y: 50 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }
    );

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleClose = () => {
    gsap.to(modalRef.current, {
      opacity: 0,
      scale: 0.8,
      y: 50,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: onClose
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let success = false;
      
      if (isLogin) {
        success = await login(formData.email, formData.password);
      } else {
        const result = await signup(formData);
        if (result.needsVerification && result.user) {
          setShowOtp(true);
          return;
        }
        success = !!result.user;
      }

      if (success) {
        handleClose();
      } else {
        setError(isLogin ? 'Invalid credentials' : 'Signup failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-deep-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-ash-gray/95 rounded-lg border border-ritual-red/30 p-8 w-full max-w-md relative"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-ritual-red transition-colors"
          aria-label="Close modal"
          title="Close"
        >
          <X size={24} />
        </button>

        {/* OTP Verification */}
        {showOtp && pendingVerificationUser ? (
          <OtpVerification
            email={pendingVerificationUser.email}
            phone={formData.phone}
            onVerified={handleClose}
          />
        ) : (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="font-cinzel text-3xl text-antique-gold mb-2">
                {isLogin ? 'Enter The Circle' : 'Join The Circle'}
              </h2>
              <p className="font-cormorant text-gray-300">
                {isLogin ? 'Welcome back, initiate' : 'Begin your transformation'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="px-4 py-3 bg-deep-black/50 border border-ritual-red/30 rounded text-white placeholder-gray-400 font-cormorant focus:outline-none focus:border-ritual-red transition-colors"
                      required
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="px-4 py-3 bg-deep-black/50 border border-ritual-red/30 rounded text-white placeholder-gray-400 font-cormorant focus:outline-none focus:border-ritual-red transition-colors"
                      required
                    />
                  </div>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-deep-black/50 border border-ritual-red/30 rounded text-white font-cormorant focus:outline-none focus:border-ritual-red transition-colors"
                    title="Date of Birth"
                    aria-label="Date of Birth"
                    required
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Mobile Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-deep-black/50 border border-ritual-red/30 rounded text-white placeholder-gray-400 font-cormorant focus:outline-none focus:border-ritual-red transition-colors"
                    required
                  />
                </>
              )}
              
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-deep-black/50 border border-ritual-red/30 rounded text-white placeholder-gray-400 font-cormorant focus:outline-none focus:border-ritual-red transition-colors"
                required
              />
              
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-deep-black/50 border border-ritual-red/30 rounded text-white placeholder-gray-400 font-cormorant focus:outline-none focus:border-ritual-red transition-colors"
                required
              />

              {error && (
                <p className="text-ritual-red text-sm font-cormorant text-center">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-ritual-red text-white font-cormorant text-lg hover:bg-blood-red transition-colors duration-300 rounded disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (isLogin ? 'Enter' : 'Join')}
              </button>
            </form>

            {/* Toggle */}
            <div className="text-center mt-6">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-cormorant text-gray-400 hover:text-antique-gold transition-colors"
              >
                {isLogin ? "New to the Circle? Join us" : "Already initiated? Enter here"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginModal;