import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Folder, FileJson } from 'lucide-react';

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
      {/* Left Side: Product Showcase (Clean, hand-designed IDE style) */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#080807] relative overflow-hidden border-r border-white/5">
        {/* Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-0" />

        {/* Header Wordmark */}
        <Link to="/" className="font-heading text-xl tracking-tight select-none focus:outline-none z-10 text-white font-extrabold">
          Pathways
        </Link>

        {/* Mockup Workspace */}
        <div className="my-auto max-w-lg z-10">
          <div className="mb-8">
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">
              AI-Generated Classrooms
            </span>
            <h2 className="font-heading text-3xl font-extrabold text-white mt-1.5 leading-tight">
              Master any skill with structured timelines.
            </h2>
            <p className="text-xs text-white/50 mt-2 font-light leading-relaxed">
              Pathways parses your subject topic, builds week-by-week goals, and streams context-aware study tutorials in parallel.
            </p>
          </div>

          {/* Mock IDE Window */}
          <div className="w-full bg-[#121211] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* IDE Window Title Bar */}
            <div className="px-4 py-2.5 border-b border-white/5 bg-black/40 flex justify-between items-center select-none">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-800" />
              </div>
              <div className="text-[10px] font-mono text-white/30">
                workspace/machine-learning/curriculum.json
              </div>
              <div className="w-10" />
            </div>

            {/* IDE Body */}
            <div className="grid grid-cols-12 font-mono text-[10px] text-white/60 p-4 min-h-[220px]">
              {/* Left Side: Directory Tree */}
              <div className="col-span-4 border-r border-white/5 pr-4 flex flex-col gap-2.5 text-white/30">
                <div className="flex items-center gap-1.5 text-white/70">
                  <Folder size={12} className="text-accent" />
                  <span className="font-bold text-[9px]">SRC/</span>
                </div>
                <div className="pl-3 flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-accent font-medium">
                    <FileJson size={12} />
                    <span>curriculum.json</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Folder size={12} />
                    <span>week-1/</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Folder size={12} />
                    <span>week-2/</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Folder size={12} />
                    <span>week-3/</span>
                  </div>
                </div>
              </div>

              {/* Right Side: JSON Editor Content */}
              <div className="col-span-8 pl-4 select-none leading-relaxed text-[10px]">
                <span className="text-emerald-500">{"{"}</span>
                <div className="pl-4">
                  <span className="text-white/40">"subject":</span> <span className="text-accent">"Machine Learning"</span>,
                  <br />
                  <span className="text-white/40">"weeks":</span> <span className="text-emerald-500">{"["}</span>
                  <div className="pl-4">
                    <span className="text-emerald-500">{"{"}</span>
                    <div className="pl-4">
                      <span className="text-white/40">"week":</span> <span className="text-amber-500">1</span>,
                      <br />
                      <span className="text-white/40">"theme":</span> <span className="text-accent">"Math foundations"</span>,
                      <br />
                      <span className="text-white/40">"resources":</span> <span className="text-white/40">["YouTube", "Books"]</span>
                    </div>
                    <span className="text-emerald-500">{"}"}</span>
                  </div>
                  <span className="text-emerald-500">{"]"}</span>
                </div>
                <span className="text-emerald-500">{"}"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Copy */}
        <div className="text-[10px] text-white/30 z-10">
          &copy; {new Date().getFullYear()} Pathways. All rights reserved.
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex flex-col min-h-screen bg-[#0D0D0C] relative z-10 justify-between">
        {/* Back Home Link */}
        <div className="p-6 md:p-10 flex justify-between items-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition">
            <ArrowLeft size={14} />
            Back to home
          </Link>
          <div className="lg:hidden font-heading text-lg font-bold text-white select-none">
            Pathways
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-grow flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[360px] p-8 bg-white/[0.01] border border-white/5 rounded-xl backdrop-blur-md">
            <h1 className="font-heading text-2xl font-extrabold tracking-tight mb-1 text-white">
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

        {/* Empty Footer Spacer */}
        <div className="h-20" />
      </div>
    </div>
  );
}
