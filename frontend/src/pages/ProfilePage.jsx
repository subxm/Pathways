import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, CheckCircle, Award, Calendar, Flame, Archive, ArrowRight } from 'lucide-react';
import { usePathStore } from '../store/pathStore';
import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { paths, fetchPaths } = usePathStore();

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  // Statistics
  const completedPaths = paths.filter((p) => p.completed || p.completedTopicsCount === p.totalTopicsCount);
  const activePaths = paths.filter((p) => !p.completed && p.completedTopicsCount < p.totalTopicsCount);
  const totalTopicsCompleted = paths.reduce((acc, curr) => acc + curr.completedTopicsCount, 0);
  const totalTopics = paths.reduce((acc, curr) => acc + curr.totalTopicsCount, 0);

  return (
    <div className="min-h-screen bg-[#0D0D0C] text-white flex flex-col font-body">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-10 mt-16">
        {/* User Card */}
        <div className="p-8 bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-xl flex flex-col sm:flex-row items-center gap-6 mb-10 shadow-lg">
          <div className="w-16 h-16 bg-accent text-white rounded-full flex items-center justify-center font-heading text-2xl font-bold">
            {user?.username?.substring(0, 2).toUpperCase()}
          </div>
          <div className="text-center sm:text-left flex-grow">
            <h1 className="font-heading text-3xl tracking-tight mb-1 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {user?.username}
            </h1>
            <p className="text-sm text-white/50 mb-2">{user?.email}</p>
            <div className="inline-flex items-center gap-1.5 text-xs text-accent font-semibold px-2.5 py-1 bg-accent/10 rounded-full">
              <Calendar size={12} />
              <span>Learning since June 2026</span>
            </div>
          </div>
        </div>

        {/* Learning Statistics Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="p-5 bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-xl text-center shadow-lg">
            <Award className="w-8 h-8 text-accent mx-auto mb-2" />
            <div className="text-3xl font-bold font-heading text-white">{completedPaths.length}</div>
            <div className="text-xs text-white/50 uppercase font-semibold tracking-wider mt-1">Paths Completed</div>
          </div>
          
          <div className="p-5 bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-xl text-center shadow-lg">
            <CheckCircle className="w-8 h-8 text-accent mx-auto mb-2" />
            <div className="text-3xl font-bold font-heading text-white">
              {totalTopicsCompleted}/{totalTopics}
            </div>
            <div className="text-xs text-white/50 uppercase font-semibold tracking-wider mt-1">Total Topics Mastered</div>
          </div>

          <div className="p-5 bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-xl text-center shadow-lg">
            <Flame className="w-8 h-8 text-accent mx-auto mb-2" />
            <div className="text-3xl font-bold font-heading text-white">5 days</div>
            <div className="text-xs text-white/50 uppercase font-semibold tracking-wider mt-1">Daily Streak</div>
          </div>
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Active Paths */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-1.5">
              <span>In Progress ({activePaths.length})</span>
            </h2>
            {activePaths.length === 0 ? (
              <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-xs text-white/40 bg-white/[0.01]">
                No active paths right now.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activePaths.map((path) => (
                  <Link
                    key={path.id}
                    to={`/path/${path.id}`}
                    className="p-4 bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-xl flex justify-between items-center transition duration-150 group shadow-md"
                  >
                    <div className="min-w-0 pr-3">
                      <span className="font-semibold text-sm sm:text-base block truncate text-white group-hover:text-accent transition">
                        {path.skill}
                      </span>
                      <span className="text-xs text-white/50 block mt-0.5">
                        {path.completedTopicsCount} of {path.totalTopicsCount} topics completed
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-accent flex-shrink-0 group-hover:translate-x-0.5 transition" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Completed Archive */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-4 flex items-center gap-1.5">
              <Archive size={16} className="text-white/60" />
              <span>Completed Archive ({completedPaths.length})</span>
            </h2>
            {completedPaths.length === 0 ? (
              <div className="p-6 border border-dashed border-white/10 rounded-xl text-center text-xs text-white/40 bg-white/[0.01]">
                Complete a learning path to archive it here!
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {completedPaths.map((path) => (
                  <Link
                    key={path.id}
                    to={`/path/${path.id}`}
                    className="p-4 bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-xl flex justify-between items-center transition duration-150 group shadow-md"
                  >
                    <div className="min-w-0 pr-3">
                      <span className="font-semibold text-sm sm:text-base block truncate line-through text-white/40">
                        {path.skill}
                      </span>
                      <span className="text-xs text-accent font-bold block mt-0.5">
                        Completed 100%
                      </span>
                    </div>
                    <Award size={16} className="text-accent flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
