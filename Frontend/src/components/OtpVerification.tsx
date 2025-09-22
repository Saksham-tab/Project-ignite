import React, { useState } from 'react';

interface OtpVerificationProps {
  email: string;
  phone?: string;
  onVerified: () => void;
}

const OtpVerification: React.FC<OtpVerificationProps> = ({ email, phone, onVerified }) => {
  const [emailOTP, setEmailOTP] = useState('');
  const [phoneOTP, setPhoneOTP] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, emailOTP, phone, phoneOTP }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      setSuccess('Verification successful!');
      onVerified();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP');
      setSuccess('OTP resent!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="p-6 bg-black/80 rounded-xl shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-white">Verify Your Account</h2>
      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-white mb-1">Email OTP</label>
          <input
            type="text"
            value={emailOTP}
            onChange={e => setEmailOTP(e.target.value)}
            className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700"
            placeholder="Enter OTP sent to your email"
            required
          />
        </div>
        {phone && (
          <div>
            <label className="block text-white mb-1">Phone OTP</label>
            <input
              type="text"
              value={phoneOTP}
              onChange={e => setPhoneOTP(e.target.value)}
              className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700"
              placeholder="Enter OTP sent to your phone"
              required
            />
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-ritual-red text-white py-2 rounded hover:bg-blood-red transition"
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
      <button
        onClick={handleResend}
        className="mt-4 w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-600 transition"
        disabled={resendLoading}
      >
        {resendLoading ? 'Resending...' : 'Resend OTP'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </div>
  );
};

export default OtpVerification; 