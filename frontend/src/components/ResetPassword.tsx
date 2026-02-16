import React, { useState } from 'react';
import type { Page } from '../App';

interface ResetPasswordProps {
  onNavigate: (page: Page) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onNavigate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get token from URL
      const token = new URLSearchParams(window.location.search).get('token');
      
      if (!token) {
        setError('Invalid reset link. Please request a new reset link.');
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password 
        }),
      });

      //  Check if response is OK
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      //  ONLY show success if actually successful
      if (data.success) {
        setSuccess(true);
      } else {
        //  Show actual error message from server
        setError(data.message || 'Failed to reset password. The link may have expired.');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Network error. Please check your connection and try again.');
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
          <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
          <p className="text-purple-100 mb-6">
            Your password has been reset successfully.
          </p>
          
          <button
            onClick={() => onNavigate('login')}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-2xl hover:shadow-xl transition-all"
          >
            Login Now
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
          <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
          <p className="text-purple-100">
            Create your new password
          </p>
        </div>

        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-white/30 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-600 text-sm font-medium"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 mb-4 border border-white/30 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          onClick={handleResetPassword}
          disabled={loading}
          className={`w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-2xl hover:shadow-xl transition-all mb-4 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
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