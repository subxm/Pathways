import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, BookOpen, User, Flame } from 'lucide-react';
import { usePathStore } from '../store/pathStore';
import Navbar from '../components/Navbar';
import Timeline from '../components/Timeline';
import ChatDrawer from '../components/ChatDrawer';

export default function PathDetailsPage() {
  const { pathId } = useParams();
  const { currentPath, fetchPathDetails, toggleTopic, isLoadingPaths } = usePathStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState(null);

  useEffect(() => {
    fetchPathDetails(pathId);
  }, [pathId, fetchPathDetails]);

  const handleOpenChatForTopic = (weekTheme, topicTitle) => {
    setChatContext({ weekTheme, topicTitle });
    setChatOpen(true);
  };

  const handleClearContext = () => {
    setChatContext(null);
  };

  if (isLoadingPaths && !currentPath) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#111110] text-[#192837] dark:text-[#EDEDED] flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col justify-center items-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs opacity-60 mt-3">Loading curriculum details...</span>
        </div>
      </div>
    );
  }

  if (!currentPath) {
    return (
      <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#111110] text-[#192837] dark:text-[#EDEDED] flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col justify-center items-center text-center px-6">
          <h2 className="font-heading text-2xl mb-2">Curriculum not found</h2>
          <p className="text-sm opacity-60 mb-6">This path may have been deleted or you do not have permission to view it.</p>
          <Link to="/dashboard" className="text-accent text-sm font-semibold hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const progressPercentage = currentPath.totalTopicsCount > 0 
    ? Math.round((currentPath.completedTopicsCount / currentPath.totalTopicsCount) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#F9F9F8] dark:bg-[#111110] text-[#192837] dark:text-[#EDEDED] flex flex-col max-h-screen overflow-hidden">
      <Navbar />

      <div className="flex-grow flex flex-row overflow-hidden relative">
        {/* Left Area: Path Details and Timeline */}
        <div className="flex-grow overflow-y-auto px-6 py-8 custom-scrollbar">
          <div className="max-w-3xl mx-auto">
            {/* Back to Dashboard */}
            <Link 
              to="/dashboard" 
              className="inline-flex items-center gap-1.5 text-xs opacity-60 hover:opacity-100 hover:text-accent transition font-semibold mb-6"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </Link>

            {/* Path Header */}
            <div className="flex justify-between items-start mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent mb-1 block">
                  Learning Path
                </span>
                <h1 className="font-heading text-3xl sm:text-4xl tracking-tight leading-tight mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  {currentPath.skill}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-xs opacity-65 font-medium">
                  <span className="bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded uppercase font-bold text-[10px]">
                    {currentPath.level}
                  </span>
                  {currentPath.goal && (
                    <span className="truncate max-w-[320px]">
                      • Goal: {currentPath.goal}
                    </span>
                  )}
                </div>
              </div>

              {/* Chat Drawer Toggle Button */}
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className={`flex items-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-bold transition focus:outline-none ${
                  chatOpen 
                    ? 'bg-neutral-200 dark:bg-neutral-800 text-text' 
                    : 'bg-accent text-white hover:brightness-110 active:scale-95'
                }`}
              >
                <MessageSquare size={14} />
                <span>{chatOpen ? 'Close Chat' : 'Ask Assistant'}</span>
              </button>
            </div>

            {/* Dashboard Progress Banner */}
            <div className="p-5 bg-[#F2F2EE] dark:bg-[#1C1C1A] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-grow">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="opacity-75">Curriculum Progress</span>
                  <span>{progressPercentage}% Completed</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-2xl font-bold font-heading block leading-none">
                  {currentPath.completedTopicsCount}/{currentPath.totalTopicsCount}
                </span>
                <span className="text-[10px] opacity-60 uppercase font-semibold tracking-wider">Topics Mastered</span>
              </div>
            </div>

            {/* Vertical Path Timeline */}
            <Timeline 
              path={currentPath} 
              onToggleTopic={toggleTopic} 
              onOpenChat={handleOpenChatForTopic}
            />
          </div>
        </div>

        {/* Right Area: Persistent Chat Drawer */}
        <ChatDrawer 
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          pathId={currentPath.id}
          activeContext={chatContext}
          onClearContext={handleClearContext}
        />
      </div>
    </div>
  );
}
