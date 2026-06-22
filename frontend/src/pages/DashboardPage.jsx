import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Flame, CheckCircle, ArrowRight } from 'lucide-react';
import { usePathStore } from '../store/pathStore';
import Navbar from '../components/Navbar';

export default function DashboardPage() {
  const { paths, fetchPaths, isLoadingPaths } = usePathStore();

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  // Statistics calculations
  const totalTopicsDone = paths.reduce((acc, curr) => acc + curr.completedTopicsCount, 0);
  const activePathsCount = paths.filter(p => !p.completed).length;
  
  // Mock streak for visual portfolio completeness
  const learningStreak = paths.length > 0 ? 5 : 0; 

  return (
    <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#111110] text-[#192837] dark:text-[#EDEDED] flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="font-heading text-4xl mb-2 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              My Workspace
            </h1>
            <p className="text-sm opacity-60">Manage your learning curricula and track your progress.</p>
          </div>
          {paths.length > 0 && (
            <Link
              to="/path/new"
              className="flex items-center gap-1.5 bg-accent text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:brightness-110 active:scale-98 transition"
            >
              <Plus size={16} />
              <span>New Path</span>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="p-5 bg-[#F2F2EE] dark:bg-[#1C1C1A] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl flex items-center gap-4">
            <div className="p-3 bg-neutral-200 dark:bg-neutral-850 rounded-lg text-accent">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold font-heading">{activePathsCount}</div>
              <div className="text-xs opacity-60 uppercase font-semibold tracking-wider">Active Paths</div>
            </div>
          </div>
          
          <div className="p-5 bg-[#F2F2EE] dark:bg-[#1C1C1A] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl flex items-center gap-4">
            <div className="p-3 bg-neutral-200 dark:bg-neutral-850 rounded-lg text-accent">
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold font-heading">{totalTopicsDone}</div>
              <div className="text-xs opacity-60 uppercase font-semibold tracking-wider">Topics Done</div>
            </div>
          </div>
          
          <div className="p-5 bg-[#F2F2EE] dark:bg-[#1C1C1A] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl flex items-center gap-4">
            <div className="p-3 bg-neutral-200 dark:bg-neutral-850 rounded-lg text-accent">
              <Flame size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold font-heading">{learningStreak} days</div>
              <div className="text-xs opacity-60 uppercase font-semibold tracking-wider">Daily Streak</div>
            </div>
          </div>
        </div>

        {/* Path List / Empty State */}
        {isLoadingPaths && paths.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm opacity-60 mt-4">Loading your learning plans...</p>
          </div>
        ) : paths.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl py-20 px-6 text-center bg-[#F2F2EE]/30 dark:bg-[#1C1C1A]/10">
            <BookOpen size={48} className="text-neutral-400 dark:text-neutral-600 mb-4" />
            <h3 className="text-xl font-heading mb-2">No learning paths created yet</h3>
            <p className="text-sm opacity-60 max-w-sm mb-8">
              Pathways generates a fully tailored week-by-week program for any skill using AI.
            </p>
            <Link
              to="/path/new"
              className="flex items-center gap-2 bg-accent text-white text-sm font-semibold py-3.5 px-6 rounded-full hover:brightness-110 active:scale-95 transition"
            >
              <span>Start your first path</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">Active Curricula</h2>
            
            {paths.map((path) => {
              const progressPercentage = path.totalTopicsCount > 0 
                ? Math.round((path.completedTopicsCount / path.totalTopicsCount) * 100)
                : 0;

              return (
                <Link
                  key={path.id}
                  to={`/path/${path.id}`}
                  className="block p-6 bg-[#F2F2EE] dark:bg-[#1C1C1A] border border-[#E5E5E4] dark:border-[#2A2A28] hover:border-[#192837]/30 dark:hover:border-[#EDEDED]/30 rounded-xl transition duration-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-heading text-2xl tracking-tight mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                        {path.skill}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded uppercase">
                          {path.level}
                        </span>
                        {path.goal && (
                          <span className="text-xs opacity-60 truncate max-w-[250px]">
                            • Goal: {path.goal}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-accent">{progressPercentage}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center mt-3 text-xs opacity-60">
                    <span>{path.completedTopicsCount} of {path.totalTopicsCount} topics completed</span>
                    <span className="flex items-center gap-1 text-accent font-semibold hover:underline">
                      Open Path <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
