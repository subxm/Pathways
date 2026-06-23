import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, BookOpen, Flame, CheckCircle, ArrowRight, User, LogOut, Search, Download, FileText, X } from 'lucide-react';
import { usePathStore } from '../store/pathStore';
import { useAuthStore } from '../store/authStore';

export default function DashboardPage() {
  const { paths, fetchPaths, isLoadingPaths } = usePathStore();
  const { logoutUser } = useAuthStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'completed'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('created-desc');
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [scratchpadNote, setScratchpadNote] = useState(() => {
    return localStorage.getItem('pathways_scratchpad') || '';
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Statistics calculations
  const totalTopicsDone = paths.reduce((acc, curr) => acc + curr.completedTopicsCount, 0);
  const completedPathsCount = paths.filter(p => p.completed || p.completedTopicsCount === p.totalTopicsCount).length;
  const activePathsCount = paths.length - completedPathsCount;
  
  // Total Topics count for average calculation
  const totalTopicsCountAll = paths.reduce((acc, curr) => acc + curr.totalTopicsCount, 0);
  const overallProgressPercentage = totalTopicsCountAll > 0
    ? Math.round((totalTopicsDone / totalTopicsCountAll) * 100)
    : 0;

  // Mock streak for visual portfolio completeness
  const learningStreak = paths.length > 0 ? 5 : 0; 

  const handleScratchpadChange = (e) => {
    const value = e.target.value;
    setScratchpadNote(value);
    localStorage.setItem('pathways_scratchpad', value);
  };

  const handleDownloadSyllabus = (e, path) => {
    e.preventDefault();
    e.stopPropagation();

    let markdown = `# Curriculum: ${path.skill}\n\n`;
    markdown += `* **Level:** ${path.level}\n`;
    if (path.goal) {
      markdown += `* **Goal:** ${path.goal}\n`;
    }
    markdown += `* **Progress:** ${path.completedTopicsCount} of ${path.totalTopicsCount} topics completed (${Math.round((path.completedTopicsCount / path.totalTopicsCount) * 100)}%)\n\n`;
    markdown += `---\n\n`;

    if (path.weeks && path.weeks.length > 0) {
      const sortedWeeks = [...path.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
      sortedWeeks.forEach(week => {
        markdown += `## Week ${week.weekNumber}: ${week.theme}\n\n`;
        if (week.topics && week.topics.length > 0) {
          week.topics.forEach(topic => {
            const isDone = topic.completed || topic.isCompleted ? '[x]' : '[ ]';
            markdown += `- ${isDone} **${topic.title}**\n`;
            if (topic.description) {
              markdown += `  *Description:* ${topic.description}\n`;
            }
            if (topic.url) {
              markdown += `  *Reference:* [Link](${topic.url})\n`;
            }
          });
          markdown += `\n`;
        }
      });
    } else {
      markdown += `*Syllabus content outline generated.* (For detailed references, visit your Pathways Workspace details page)\n`;
    }

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${path.skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-syllabus.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and Sort paths
  const filteredAndSortedPaths = paths
    .filter((path) => {
      const matchesSearch = 
        path.skill.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (path.goal && path.goal.toLowerCase().includes(searchQuery.toLowerCase()));

      const isPathCompleted = path.completed || path.completedTopicsCount === path.totalTopicsCount;
      if (activeTab === 'active') {
        return matchesSearch && !isPathCompleted;
      }
      if (activeTab === 'completed') {
        return matchesSearch && isPathCompleted;
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'created-desc') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'created-asc') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'skill-asc') {
        return a.skill.localeCompare(b.skill);
      }
      if (sortBy === 'skill-desc') {
        return b.skill.localeCompare(a.skill);
      }
      if (sortBy === 'progress-desc') {
        const progressA = a.totalTopicsCount > 0 ? (a.completedTopicsCount / a.totalTopicsCount) : 0;
        const progressB = b.totalTopicsCount > 0 ? (b.completedTopicsCount / b.totalTopicsCount) : 0;
        return progressB - progressA;
      }
      if (sortBy === 'progress-asc') {
        const progressA = a.totalTopicsCount > 0 ? (a.completedTopicsCount / a.totalTopicsCount) : 0;
        const progressB = b.totalTopicsCount > 0 ? (b.completedTopicsCount / b.totalTopicsCount) : 0;
        return progressA - progressB;
      }
      return 0;
    });

  return (
    <div className="relative min-h-screen bg-[#0D0D0C] text-white flex flex-col font-body overflow-x-hidden">
      <main className="relative z-10 flex-grow w-full px-8 md:px-12 pb-20">
        
        {/* Sleek Workspace Header */}
        <div className="flex justify-end items-center py-6 border-b border-white/5 mb-10 relative">
          
          {/* Profile Dropdown Container */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/5 hover:border-accent flex items-center justify-center text-white/80 hover:text-white transition hover:bg-white/10 focus:outline-none"
              title="Profile Options"
            >
              <User size={18} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#121211] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  to="/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5 transition font-medium"
                >
                  <User size={16} className="text-white/60" />
                  <span>Profile</span>
                </Link>
                <div className="h-px bg-white/5 my-1" />
                <button
                  onClick={async () => {
                    setIsDropdownOpen(false);
                    await logoutUser();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-950/20 transition font-medium text-left"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="font-heading text-4xl mb-2 tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
              Workspace
            </h1>
            <p className="text-sm text-white/50">Manage your generated AI curriculums and learning progress.</p>
          </div>
          <Link
            to="/path/new"
            className="flex items-center justify-center gap-1.5 bg-accent text-white text-sm font-semibold py-2.5 px-4 rounded-lg hover:brightness-110 active:scale-98 transition self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Generate New Path</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="relative group p-5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-4 hover:border-white/10 transition shadow-lg cursor-help">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-64 p-3 bg-[#121211] border border-white/10 text-white/70 text-[11px] rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 text-center leading-relaxed">
              <span className="font-semibold text-white block mb-1">Active Curricula</span>
              You have {activePathsCount} learning roadmaps currently in progress. Complete topics to increase your score!
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#121211]" />
            </div>
            <div className="p-3 bg-accent/10 rounded-lg text-accent">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold font-heading">{activePathsCount}</div>
              <div className="text-xs text-white/40 uppercase font-semibold tracking-wider">Active Paths</div>
            </div>
          </div>
          
          <div className="relative group p-5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-4 hover:border-white/10 transition shadow-lg cursor-help">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-64 p-3 bg-[#121211] border border-white/10 text-white/70 text-[11px] rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 text-center leading-relaxed">
              <span className="font-semibold text-white block mb-1">Total Completion Score</span>
              Across all generated roadmaps, you have completed {totalTopicsDone} topics, marking {overallProgressPercentage}% overall progress.
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#121211]" />
            </div>
            <div className="p-3 bg-accent/10 rounded-lg text-accent">
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold font-heading">{totalTopicsDone}</div>
              <div className="text-xs text-white/40 uppercase font-semibold tracking-wider">Topics Completed</div>
            </div>
          </div>
          
          <div className="relative group p-5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-4 hover:border-white/10 transition shadow-lg cursor-help">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-64 p-3 bg-[#121211] border border-white/10 text-white/70 text-[11px] rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 text-center leading-relaxed">
              <span className="font-semibold text-white block mb-1">Daily Habit Streak</span>
              You are doing great! Complete at least one topic checkmark today to extend your learning streak.
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#121211]" />
            </div>
            <div className="p-3 bg-accent/10 rounded-lg text-accent">
              <Flame size={20} />
            </div>
            <div>
              <div className="text-2xl font-bold font-heading">{learningStreak} days</div>
              <div className="text-xs text-white/40 uppercase font-semibold tracking-wider">Learning Streak</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            
            <div className="flex gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-lg self-start">
              {[
                { id: 'all', label: 'All Curricula' },
                { id: 'active', label: 'In Progress' },
                { id: 'completed', label: 'Completed' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-md font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto flex-shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto pl-3 pr-8 py-2 text-xs bg-white/[0.02] border border-white/5 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition text-white/80 hover:text-white appearance-none cursor-pointer font-semibold"
                >
                  <option value="created-desc" className="bg-[#121211] text-white">Newest First</option>
                  <option value="created-asc" className="bg-[#121211] text-white">Oldest First</option>
                  <option value="skill-asc" className="bg-[#121211] text-white">Name (A-Z)</option>
                  <option value="skill-desc" className="bg-[#121211] text-white">Name (Z-A)</option>
                  <option value="progress-desc" className="bg-[#121211] text-white">Progress (High to Low)</option>
                  <option value="progress-asc" className="bg-[#121211] text-white">Progress (Low to High)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-white/40">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative w-full sm:w-48">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/35">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search curricula..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white/[0.02] border border-white/5 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition text-white placeholder-white/30"
                />
              </div>
            </div>
          </div>

          {isLoadingPaths && paths.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-white/50 mt-4">Loading your learning plans...</p>
            </div>
          ) : paths.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-white/10 rounded-xl py-20 px-6 text-center bg-white/[0.01]">
              <BookOpen size={48} className="text-white/20 mb-4" />
              <h3 className="text-xl font-heading mb-2">No learning paths created yet</h3>
              <p className="text-sm text-white/50 max-w-sm mb-8">
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
          ) : filteredAndSortedPaths.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search size={32} className="text-white/25 mb-3" />
              <p className="text-sm text-white/40">No curricula matches your current filter or query.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredAndSortedPaths.map((path) => {
                const progressPercentage = path.totalTopicsCount > 0 
                  ? Math.round((path.completedTopicsCount / path.totalTopicsCount) * 100)
                  : 0;

                const isPathCompleted = path.completed || path.completedTopicsCount === path.totalTopicsCount;

                return (
                  <Link
                    key={path.id}
                    to={`/path/${path.id}`}
                    className="block p-5 bg-white/[0.02] border border-white/5 hover:border-accent/40 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-md relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />

                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3 className="font-heading text-2xl tracking-tight mb-1 text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {path.skill}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-white/5 border border-white/5 text-white/70 rounded uppercase">
                            {path.level}
                          </span>
                          {path.goal && (
                            <span className="text-[11px] text-white/40 truncate max-w-[250px]">
                              • Goal: {path.goal}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-sm font-bold text-accent">{progressPercentage}%</span>
                        {isPathCompleted && (
                          <span className="text-[9px] font-bold text-accent uppercase tracking-wider bg-accent/15 px-1.5 py-0.5 rounded">
                            Done
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative z-10">
                      <div 
                        className="h-full bg-accent transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-3 text-xs text-white/50 relative z-10">
                      <span>{path.completedTopicsCount} of {path.totalTopicsCount} topics completed</span>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleDownloadSyllabus(e, path)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-accent/25 hover:text-accent border border-white/5 text-white/60 transition"
                          title="Download Syllabus (.md)"
                        >
                          <Download size={13} />
                        </button>

                        {!isPathCompleted ? (
                          <span className="flex items-center gap-1 bg-accent/15 text-accent font-bold px-2.5 py-1 rounded-lg hover:bg-accent hover:text-white transition duration-200 text-[10px]">
                            Resume Learning
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-accent font-semibold group-hover:translate-x-1 transition duration-200">
                            Open Workspace <ArrowRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <button
        onClick={() => setIsScratchpadOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-accent text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition z-40 flex items-center justify-center border border-white/10"
        title="AI Study Notes Scratchpad"
      >
        <FileText size={20} />
      </button>

      {isScratchpadOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => setIsScratchpadOpen(false)}
          />
          
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#121211] border-l border-white/10 shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-accent" />
                <h3 className="font-heading text-lg font-bold">Study Scratchpad</h3>
              </div>
              <button 
                onClick={() => setIsScratchpadOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-full transition text-white/60 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-xs text-white/50 mb-4 leading-normal font-medium">
              Use this scratchpad to quickly save notes, code blocks, or links generated by the AI assistant during your studies. Your notes are saved automatically in your browser.
            </p>

            <textarea
              value={scratchpadNote}
              onChange={handleScratchpadChange}
              placeholder="Paste AI notes or write your thoughts here..."
              className="flex-grow w-full p-4 bg-black/40 border border-white/5 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition text-white placeholder-white/20 resize-none font-mono"
            />
            
            <div className="flex justify-between items-center mt-4 text-[10px] text-white/30 font-medium">
              <span>Characters: {scratchpadNote.length}</span>
              <span>Auto-saved locally</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
