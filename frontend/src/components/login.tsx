import React, { useState } from 'react';
import type { Page } from '../App';

interface LoginProps {
  onNavigate: (page: Page) => void;
  onLogin: (user: any, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate, onLogin }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); //  Success state add karo

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        //  Success message show karo
        setSuccess(true);
        
        //  2 seconds baad automatically dashboard pe redirect with login
        setTimeout(() => {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user, data.token);
        }, 2000);
        
      } else {
        setError(data.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  //  Agar success hai toh success message dikhao
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 p-4">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Glotspeak
        </h1>

        <div className="bg-white/10 backdrop-blur-lg shadow-lg rounded-2xl p-6 w-full max-w-sm text-center">
          <div className="text-green-400 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-white mb-2">Login Successful!</h2>
          <p className="text-purple-100 mb-6">
            You have been logged in successfully. Redirecting to dashboard...
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
      <h1 className="text-3xl font-bold text-white mb-6 text-center">
        Glotspeak
      </h1>

      <div className="bg-white/10 backdrop-blur-lg shadow-lg rounded-2xl p-6 w-full max-w-sm">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mb-4 border border-white/30 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
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

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-3 rounded-2xl hover:shadow-xl transition-all mb-4 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="flex justify-between text-sm text-white/80">
          <button 
            onClick={() => onNavigate('forgot')} 
            className="underline"
            disabled={loading}
          >
            Forgot Password?
          </button>
          <button 
            onClick={() => onNavigate('register')} 
            className="underline"
            disabled={loading}
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};