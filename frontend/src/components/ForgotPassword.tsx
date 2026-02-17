import React, { useState } from 'react';
import type { Page } from '../App';

// Step 1: Import the logo
import logo from '../assets/images/glotspeak_logo.png';

interface ForgotPasswordProps {
  onNavigate: (page: Page) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
        {/* Consistent Logo Placement */}
        <img src={logo} alt="GlotSpeak Logo" className="h-16 w-auto mb-8 drop-shadow-lg" />

        <div className="bg-white/10 backdrop-blur-lg shadow-lg rounded-2xl p-6 w-full max-w-sm text-center border border-white/20">
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
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-2xl font-bold hover:shadow-xl transition-all mb-4"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
      
      {/* Step 2: Professional Logo Placement */}
      <div className="flex flex-col items-center mb-8">
        <img 
          src={logo} 
          alt="GlotSpeak Logo" 
          className="h-14 w-auto drop-shadow-xl hover:scale-105 transition-transform duration-300" 
        />
      </div>

      <div className="bg-white/10 backdrop-blur-lg shadow-lg rounded-2xl p-6 w-full max-w-sm border border-white/20">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-purple-100 text-sm">
            Enter your email to receive a reset link
          </p>
        </div>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-6 border border-white/30 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
        />

        <button
          onClick={handleForgotPassword}
          disabled={loading}
          className={`w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-2xl font-bold hover:shadow-xl transition-all mb-6 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <div className="flex justify-center text-sm">
          <button 
            onClick={() => onNavigate('login')} 
            className="text-white/80 hover:text-white transition-colors flex items-center gap-1"
            disabled={loading}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};