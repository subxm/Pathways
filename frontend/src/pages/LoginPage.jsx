import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CheckCircle2, Sparkles, Play, BookOpen, MessageSquare, Lock } from 'lucide-react';

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
    <div className="min-h-screen bg-[#0D0D0C] text-white font-body grid grid-cols-1 lg:grid-cols-12 relative overflow-hidden select-none">
      {/* Left Side: Detailed Product Showcase (col-span-7) */}
      <div className="hidden lg:flex lg:col-span-7 flex-col justify-center p-16 bg-[#080807] relative overflow-hidden border-r border-white/5">
        {/* Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-0" />

        {/* Mockup Workspace (utilizing complete space up to max-w-2xl) */}
        <div className="max-w-2xl z-10 w-full mx-auto">
          <div className="mb-10 max-w-lg">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              AI-Generated Classrooms
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-white mt-1.5 leading-tight">
              Master any skill with structured timelines.
            </h2>
            <p className="text-xs text-white/50 mt-2.5 font-light leading-relaxed">
              Pathways compiles comprehensive week-by-week goals, binds high-quality visual/textual reference materials, and starts a context-aware AI tutor.
            </p>
          </div>

          {/* Highly Realistic Dashboard Mockup */}
          <div className="w-full bg-[#121211] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* Window Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-black/40 flex justify-between items-center">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
              </div>
              <div className="text-[10px] font-mono text-white/30">
                workspace/machine-learning-beginner
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-accent/15 border border-accent/20 px-2 py-0.5 rounded text-accent font-bold font-mono">ACTIVE WORKSPACE</span>
              </div>
            </div>

            {/* Mock Dashboard Body */}
            <div className="grid grid-cols-12 min-h-[300px] text-xs">
              {/* Timeline Sidebar (col-span-5) */}
              <div className="col-span-5 border-r border-white/5 p-4 flex flex-col gap-4">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  Weekly Modules
                </span>
                
                <div className="flex flex-col gap-2.5">
                  {/* Module 1: Checked */}
                  <div className="p-2.5 bg-accent/5 border border-accent/20 rounded-lg flex items-center gap-2.5">
                    <CheckCircle2 size={14} className="text-accent shrink-0" />
                    <div className="truncate flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="text-[8px] text-accent uppercase font-bold">Week 1</span>
                        <span className="text-[7px] bg-accent/20 text-accent px-1 py-0.2 rounded font-bold">100% DONE</span>
                      </div>
                      <div className="text-[10px] font-semibold text-white/80 truncate mt-0.5">Linear Algebra Basics</div>
                    </div>
                  </div>

                  {/* Module 2: Active */}
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                    <div className="truncate flex-grow">
                      <div className="text-[8px] text-white/40 uppercase font-bold">Week 2</div>
                      <div className="text-[10px] font-semibold text-white truncate mt-0.5">Supervised Learning</div>
                    </div>
                  </div>

                  {/* Module 3: Locked */}
                  <div className="p-2.5 opacity-40 rounded-lg flex items-center gap-2.5">
                    <Lock size={12} className="text-white/40 shrink-0" />
                    <div className="truncate flex-grow">
                      <div className="text-[8px] text-white/40 uppercase font-bold">Week 3</div>
                      <div className="text-[10px] font-semibold text-white/60 truncate mt-0.5">Neural Networks</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-auto pt-3 border-t border-white/5">
                  <div className="flex justify-between text-[8px] font-semibold text-white/45 mb-1.5">
                    <span>PROGRESS SUMMARY</span>
                    <span>33% COMPLETE</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-1/3" />
                  </div>
                </div>
              </div>

              {/* AI Guide Chat (col-span-7) */}
              <div className="col-span-7 p-4 flex flex-col justify-between bg-black/10">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={10} className="text-accent" />
                    AI Study Guide
                  </span>
                  <span className="text-[8px] text-white/40 font-mono">context: week_2</span>
                </div>

                <div className="flex flex-col gap-3 my-4">
                  {/* AI Message */}
                  <div className="p-3 bg-white/5 border border-white/5 rounded-lg rounded-tl-none text-[10px] text-white/75 leading-relaxed">
                    Think of gradient descent as finding the lowest valley in a dense fog. At each step, you calculate the slope (gradient) and move in the direction that goes downwards.
                  </div>
                  
                  {/* User Message */}
                  <div className="p-2.5 bg-accent text-white rounded-lg rounded-tr-none text-[10px] self-end max-w-[85%] leading-relaxed">
                    Explain gradient descent simply.
                  </div>
                </div>

                {/* Suggestion Chips */}
                <div className="flex gap-1.5 mb-2">
                  <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] text-white/50">Quiz me ⚡</span>
                  <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] text-white/50">Curate videos →</span>
                </div>

                {/* Mock Input Bar */}
                <div className="p-2 bg-black/30 border border-white/5 rounded-md text-[9px] text-white/30 flex justify-between items-center">
                  <span>Ask a question about week 2...</span>
                  <MessageSquare size={10} className="text-white/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form (col-span-5) */}
      <div className="flex flex-col lg:col-span-5 min-h-screen bg-[#0D0D0C] relative z-10 justify-center px-8 sm:px-12 md:px-16">
        <div className="w-full max-w-[400px] mx-auto">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white leading-tight">
              Welcome back
            </h1>
            <p className="text-xs text-white/40 mt-1.5 leading-relaxed">Sign in to continue your learning journey.</p>
          </div>

          {error && (
            <div className="p-3 mb-4 text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 text-xs bg-white/[0.02] border border-white/5 text-white placeholder-white/10 rounded-xl focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/5 hover:bg-white/[0.04] transition duration-200"
                placeholder="developer_pathways"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-white/30 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 text-xs bg-white/[0.02] border border-white/5 text-white placeholder-white/10 rounded-xl focus:outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/5 hover:bg-white/[0.04] transition duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 mt-2 bg-accent text-white text-xs font-semibold rounded-xl border border-white/5 hover:brightness-110 active:scale-[0.99] transition duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-white/30">
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
