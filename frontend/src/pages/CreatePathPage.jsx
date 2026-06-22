import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { usePathStore } from '../store/pathStore';
import Navbar from '../components/Navbar';

export default function CreatePathPage() {
  const [skill, setSkill] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  
  const { generatePath, isGeneratingPath } = usePathStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!skill.trim()) {
      setError('Please enter a skill you want to learn.');
      return;
    }

    const res = await generatePath(skill.trim(), level, goal.trim());
    if (res.success) {
      navigate(`/path/${res.path.id}`);
    } else {
      setError(res.message);
    }
  };

  if (isGeneratingPath) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#111110] text-[#192837] dark:text-[#EDEDED] flex flex-col justify-center items-center px-6">
        <div className="max-w-[400px] w-full text-center flex flex-col items-center">
          {/* Neutral Spinner */}
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
          
          <h2 className="font-heading text-2xl tracking-tight mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Generating Curriculum
          </h2>
          <p className="text-sm opacity-60 mb-8">
            Please wait. We are structuring your learning path and fetching references.
          </p>

          <div className="w-full text-left bg-[#F2F2EE] dark:bg-[#1C1C1A] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl p-5 flex flex-col gap-3.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-accent">●</span>
              <span className="font-semibold">Defining week-by-week goals...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent animate-pulse">●</span>
              <span className="opacity-70">Querying YouTube lecture databases...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">●</span>
              <span className="opacity-40">Scanning Google Books recommendations...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#111110] text-[#192837] dark:text-[#EDEDED] flex flex-col">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[500px] p-8 bg-[#F2F2EE] dark:bg-[#1C1C1A] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Sparkles size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">AI Curator</span>
          </div>
          
          <h1 className="font-heading text-3xl mb-1 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            Start a new path
          </h1>
          <p className="text-sm opacity-60 mb-6">Configure your parameters to generate a learning timeline.</p>

          {error && (
            <div className="p-3 mb-4 text-xs font-semibold bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-md flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Skill Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-60 mb-1.5">
                What do you want to learn?
              </label>
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white dark:bg-[#0D0D0C] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-medium"
                placeholder="e.g. Docker, Rust Programming, Deep Learning..."
                maxLength={80}
              />
            </div>

            {/* Level Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-60 mb-1.5">
                Current Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`py-3 text-xs font-bold rounded-lg border transition ${
                      level === lvl
                        ? 'bg-accent border-accent text-white'
                        : 'bg-white dark:bg-[#0D0D0C] border-[#E5E5E4] dark:border-[#2A2A28] hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Goal */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider opacity-60 mb-1.5">
                Your Goal (Optional)
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white dark:bg-[#0D0D0C] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                placeholder="e.g. Build an API, Get a job, Prep for interview..."
                maxLength={120}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-accent text-white text-sm font-semibold rounded-lg hover:brightness-110 active:scale-98 transition flex justify-center items-center gap-2"
            >
              <BookOpen size={16} />
              <span>Generate My Path</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
