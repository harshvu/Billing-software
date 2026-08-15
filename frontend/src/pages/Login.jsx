import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy to-navy-dark px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-navy px-8 py-8 text-center">
          <img src={logo} alt="Business Mint" className="h-20 w-auto block mx-auto mb-3" />
          <p className="text-gray-300 text-sm">Billing &amp; Invoice Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8">
          <h2 className="text-xl font-bold text-navy mb-1">Sign in to your account</h2>
          <p className="text-sm text-gray-500 mb-6">Admin and Employee login</p>

          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-4 focus:ring-2 focus:ring-navy/40 focus:border-navy text-sm"
          />

          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 mb-6 focus:ring-2 focus:ring-navy/40 focus:border-navy text-sm"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy hover:bg-navy-dark transition text-white font-semibold py-2.5 rounded-lg disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
