import React, { useState } from 'react';
import { Play, BookOpen, ExternalLink, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

export default function Timeline({ path, onToggleTopic, onOpenChat }) {
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [activeTopicId, setActiveTopicId] = useState(null);

  const toggleWeekExpand = (weekId) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekId]: !prev[weekId],
    }));
  };

  // Helper: check if a week is completed (all topics inside it are completed)
  const isWeekCompleted = (week) => {
    return week.topics.length > 0 && week.topics.every((t) => t.isCompleted || t.completed);
  };

  // Helper: check if a week is active (not completed, and is the first incomplete week)
  const getActiveWeekId = () => {
    if (!path.weeks) return null;
    const sortedWeeks = [...path.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    for (const week of sortedWeeks) {
      if (!isWeekCompleted(week)) {
        return week.id;
      }
    }
    return null;
  };

  const activeWeekId = getActiveWeekId();

  if (!path.weeks || path.weeks.length === 0) return null;

  const sortedWeeks = [...path.weeks].sort((a, b) => a.weekNumber - b.weekNumber);

  return (
    <div className="relative pl-8 sm:pl-10 py-4">
      {/* Central vertical line */}
      <div className="absolute left-[15px] sm:left-[19px] top-0 bottom-0 w-[2px] bg-neutral-200 dark:bg-neutral-800 z-0" />

      <div className="flex flex-col gap-10">
        {sortedWeeks.map((week, weekIndex) => {
          const completed = isWeekCompleted(week);
          const active = week.id === activeWeekId;
          const expanded = expandedWeeks[week.id] !== false; // expanded by default

          // Determine dot color & animation
          let dotClass = "border-neutral-300 bg-white dark:border-neutral-700 dark:bg-[#111110]";
          if (completed) {
            dotClass = "border-accent bg-accent";
          } else if (active) {
            dotClass = "border-accent bg-white dark:bg-[#111110] pulse-node";
          }

          return (
            <div key={week.id} className="relative z-10 flex flex-col gap-3">
              {/* Timeline Dot */}
              <div 
                className={`absolute left-[-25px] sm:left-[-29px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-20 ${dotClass}`}
              >
                {completed && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {active && !completed && (
                  <div className="w-2.5 h-2.5 bg-accent rounded-full" />
                )}
              </div>

              {/* Week Card */}
              <div className="bg-white/[0.02] border border-white/5 backdrop-blur-sm rounded-xl overflow-hidden">
                {/* Header */}
                <button
                  onClick={() => toggleWeekExpand(week.id)}
                  className="w-full px-5 py-4 flex justify-between items-center text-left hover:bg-white/[0.03] transition focus:outline-none"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-accent mb-0.5 block">
                      Week {week.weekNumber}
                    </span>
                    <h3 className="font-heading text-lg sm:text-xl tracking-tight leading-tight text-white">
                      {week.theme}
                    </h3>
                  </div>
                  {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {/* Body Content */}
                {expanded && (
                  <div className="px-5 pb-5 border-t border-white/5 pt-4">
                    {/* Objectives */}
                    {week.objectivesList && week.objectivesList.length > 0 && (
                      <div className="mb-5">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-2">
                          Objectives
                        </span>
                        <ul className="flex flex-wrap gap-2">
                          {week.objectivesList.map((obj, i) => (
                            <li 
                              key={i} 
                              className="text-xs bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-white/80"
                            >
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Topics List */}
                    <div className="flex flex-col gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block">
                        Topics
                      </span>
                      
                      {week.topics.map((topic) => {
                        const isTopicCompleted = topic.isCompleted || topic.completed;
                        const isTopicActive = activeTopicId === topic.id;

                        return (
                          <div 
                            key={topic.id}
                            className={`border rounded-lg transition duration-200 ${
                              isTopicActive 
                                ? 'bg-white/5 border-white/10 text-white' 
                                : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03] text-white/80'
                            }`}
                          >
                            {/* Topic Row */}
                            <div className="flex items-center justify-between p-4 gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                 <button
                                   onClick={() => onToggleTopic(path.id, topic.id, !isTopicCompleted)}
                                   className="focus:outline-none flex-shrink-0 transition-transform active:scale-95"
                                   title={isTopicCompleted ? "Mark incomplete" : "Mark complete"}
                                 >
                                   <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                                     isTopicCompleted 
                                       ? 'bg-accent border-accent text-white shadow-lg shadow-accent/25 scale-105' 
                                       : 'bg-black/30 border-white/20 text-transparent hover:border-accent hover:bg-accent/5'
                                   }`}>
                                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                     </svg>
                                   </div>
                                 </button>
                                
                                <button
                                  onClick={() => setActiveTopicId(isTopicActive ? null : topic.id)}
                                  className="text-left font-medium text-sm sm:text-base hover:underline focus:outline-none min-w-0"
                                >
                                  <span className={`block truncate ${isTopicCompleted ? 'line-through opacity-50' : ''}`}>
                                    {topic.title}
                                  </span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => onOpenChat(week.theme, topic.title)}
                                  className="p-1.5 hover:bg-white/5 rounded-md transition text-accent"
                                  title="Ask assistant about this topic"
                                >
                                  <MessageSquare size={16} />
                                </button>
                                <button
                                  onClick={() => setActiveTopicId(isTopicActive ? null : topic.id)}
                                  className="text-xs opacity-60 hover:opacity-100 transition focus:outline-none"
                                >
                                  {isTopicActive ? 'Hide' : 'Details'}
                                </button>
                              </div>
                            </div>

                            {/* Topic Details (Expandable) */}
                            {isTopicActive && (
                              <div className="px-4 pb-4 border-t border-dashed border-white/5 pt-3 text-sm">
                                <p className="opacity-70 mb-4 text-xs sm:text-sm text-white/70">
                                  {topic.description}
                                </p>

                                {/* Resources Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                  {topic.resources.map((res) => {
                                    const isYoutube = res.type === 'YOUTUBE';
                                    const isBook = res.type === 'BOOK';
                                    
                                    return (
                                      <a
                                        key={res.id}
                                        href={res.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-white/[0.01] border border-white/5 hover:border-accent/40 rounded-lg flex items-start gap-3 transition"
                                      >
                                        {isYoutube && (
                                          <div className="p-2 bg-red-950/20 text-red-400 rounded">
                                            <Play size={16} className="fill-red-600/10" />
                                          </div>
                                        )}
                                        {isBook && (
                                          <div className="p-2 bg-blue-950/20 text-blue-400 rounded">
                                            <BookOpen size={16} />
                                          </div>
                                        )}
                                        {res.type === 'DOCUMENT' && (
                                          <div className="p-2 bg-emerald-950/20 text-emerald-400 rounded">
                                            <ExternalLink size={16} />
                                          </div>
                                        )}
                                        <div className="min-w-0 text-xs">
                                          <span className="font-semibold block truncate leading-tight text-white">
                                            {res.title}
                                          </span>
                                          <span className="opacity-55 block truncate mt-0.5 text-white/50">
                                            {res.description || (isYoutube ? 'YouTube Video Tutorial' : 'Learning resource')}
                                          </span>
                                        </div>
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
