import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { loginUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    const res = await loginUser(username, password);
    if (res.success) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#111110] text-[#192837] dark:text-[#EDEDED] flex flex-col">
      <Navbar />
      
      <div className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px] p-8 bg-[#F2F2EE] dark:bg-[#1C1C1A] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl">
          <h1 className="font-heading text-3xl mb-2 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Welcome back
          </h1>
          <p className="text-sm opacity-60 mb-6">Sign in to continue your learning journey.</p>
          
          {error && (
            <div className="p-3 mb-4 text-xs font-semibold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white dark:bg-[#0D0D0C] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                placeholder="developer_pathways"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-60 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white dark:bg-[#0D0D0C] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-accent text-white text-sm font-semibold rounded-lg hover:brightness-110 transition active:scale-98 disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E5E5E4] dark:border-[#2A2A28] text-center text-xs opacity-60">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-accent hover:underline">
              Create one →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
