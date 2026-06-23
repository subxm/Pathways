import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const res = await registerUser(username, email, password);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0C] text-white font-body grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden select-none">
      {/* Left Side: Product Showcase (Realistic dashboard layout) */}
      <div className="hidden lg:flex flex-col justify-center p-16 bg-[#080807] relative overflow-hidden border-r border-white/5">
        {/* Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-0" />

        {/* Mockup Workspace */}
        <div className="max-w-lg z-10 w-full mx-auto">
          <div className="mb-10">
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

          {/* Realistic Dashboard Mockup */}
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
              <div className="w-10" />
            </div>

            {/* Mock Dashboard Body */}
            <div className="grid grid-cols-12 min-h-[260px] text-xs">
              {/* Timeline Sidebar (col-span-6) */}
              <div className="col-span-6 border-r border-white/5 p-4 flex flex-col gap-3">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider">
                  Weekly Modules
                </span>
                
                <div className="flex flex-col gap-2">
                  {/* Module 1: Checked */}
                  <div className="p-2 bg-accent/5 border border-accent/20 rounded-lg flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-accent" />
                    <div className="truncate">
                      <div className="text-[8px] text-accent uppercase font-bold">Week 1</div>
                      <div className="text-[10px] font-semibold text-white/80 truncate">Linear Algebra Basics</div>
                    </div>
                  </div>

                  {/* Module 2: Active */}
                  <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-white/20 shrink-0" />
                    <div className="truncate">
                      <div className="text-[8px] text-white/40 uppercase font-bold">Week 2</div>
                      <div className="text-[10px] font-semibold text-white truncate">Supervised Learning</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-auto pt-2 border-t border-white/5">
                  <div className="flex justify-between text-[8px] font-semibold text-white/40 mb-1">
                    <span>PROGRESS</span>
                    <span>50%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-1/2" />
                  </div>
                </div>
              </div>

              {/* AI Guide Chat (col-span-6) */}
              <div className="col-span-6 p-4 flex flex-col justify-between bg-black/10">
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={9} className="text-accent" />
                  AI Study Guide
                </span>

                <div className="flex flex-col gap-2.5 my-3">
                  {/* AI Message */}
                  <div className="p-2.5 bg-white/5 border border-white/5 rounded-lg rounded-tl-none text-[10px] text-white/75 leading-relaxed">
                    Think of gradient descent as finding the lowest valley in a dense fog. You take steps in the direction of the steepest slope.
                  </div>
                  
                  {/* User Message */}
                  <div className="p-2 bg-accent text-white rounded-lg rounded-tr-none text-[10px] self-end max-w-[90%] leading-relaxed">
                    Explain gradient descent.
                  </div>
                </div>

                {/* Mock Input Bar */}
                <div className="p-1.5 bg-black/30 border border-white/5 rounded-md text-[8px] text-white/30">
                  Ask a question...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex flex-col min-h-screen bg-[#0D0D0C] relative z-10 justify-center">
        {/* Form Container */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[460px] p-10 bg-white/[0.01] border border-white/5 rounded-2xl backdrop-blur-md">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight mb-1 text-white">
              Start learning
            </h1>
            <p className="text-xs text-white/50 mb-6">Create a free account to generate personalized paths.</p>

            {error && (
              <div className="p-3 mb-4 text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 mb-4 text-[11px] font-semibold bg-green-500/10 text-green-450 border border-green-500/20 rounded-md">
                Registration successful! Redirecting to login...
              </div>
            )}

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white/[0.02] border border-white/5 text-white placeholder-white/20 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                  placeholder="developer_pathways"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white/[0.02] border border-white/5 text-white placeholder-white/20 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                  placeholder="developer@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white/[0.02] border border-white/5 text-white placeholder-white/20 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || success}
                className="w-full py-3 mt-2 bg-accent text-white text-xs font-semibold rounded-lg border border-white/5 hover:brightness-110 active:scale-98 transition disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-white/40">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent hover:underline">
                Sign in →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
