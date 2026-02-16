import React, { useState } from 'react';
import type { Page } from '../App';

// Step 1: Import the logo from your assets folder
import logo from '../assets/images/glotspeak_logo.png';

interface RegisterProps {
  onNavigate: (page: Page) => void;
  onLogin: (user: any, token: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate, onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onNavigate('login');
        }, 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <img src={logo} alt="GlotSpeak Logo" className="h-16 w-auto mb-8 drop-shadow-lg" />

        <div className="bg-white/10 backdrop-blur-lg shadow-lg rounded-2xl p-6 w-full max-w-sm text-center border border-white/20">
          <div className="text-green-400 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">Registration Successful!</h2>
          <p className="text-purple-100 mb-6">
            Your account has been created successfully. Redirecting to login...
          </p>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
      
      {/* Logo Placement (Tagline removed for a cleaner look) */}
      <div className="flex flex-col items-center mb-10">
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

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 mb-4 border border-white/30 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border border-white/30 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
        />

        <div className="relative mb-6">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (min. 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-white/30 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 text-sm font-semibold hover:text-gray-700"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className={`w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-2xl font-bold text-lg shadow-lg hover:shadow-orange-500/20 transition-all mb-6 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Creating Account...' : 'Get Started'}
        </button>

        <div className="flex justify-center text-sm">
          <button 
            onClick={() => onNavigate('login')} 
            className="text-white/90 hover:text-white font-medium transition-colors flex items-center gap-1"
            disabled={loading}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};