import React, { useState } from 'react';
import type { Page } from '../App';

interface ForgotPasswordProps {
  onNavigate: (page: Page) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!loading) {
        handleForgotPassword();
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Glotspeak
        </h1>

        <div className="bg-white/10 backdrop-blur-lg shadow-lg rounded-2xl p-6 w-full max-w-sm text-center">
          <div className="text-green-400 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email!</h2>
          <p className="text-purple-100 mb-4">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className="text-purple-100 text-sm mb-6">
            Click the link in the email to reset your password.
          </p>
          
          <button
            onClick={() => onNavigate('login')}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-2xl hover:shadow-xl transition-all mb-4"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">
        Glotspeak
      </h1>

      <div className="bg-white/10 backdrop-blur-lg shadow-lg rounded-2xl p-6 w-full max-w-sm">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-purple-100">
            Enter your email to receive a reset link
          </p>
        </div>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-3 mb-4 border border-white/30 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          onClick={handleForgotPassword}
          disabled={loading}
          className={`w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-2xl hover:shadow-xl transition-all mb-4 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <div className="flex justify-center text-sm text-white/80">
          <button 
            onClick={() => onNavigate('login')} 
            className="underline"
            disabled={loading}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};