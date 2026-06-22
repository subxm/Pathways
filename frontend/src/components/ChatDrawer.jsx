import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageSquare, Trash2, ArrowLeft } from 'lucide-react';
import api, { API_BASE_URL } from '../api/axios';

export default function ChatDrawer({ isOpen, onClose, pathId, activeContext, onClearContext }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // Fetch history on mount / path change
  useEffect(() => {
    if (isOpen && pathId) {
      fetchHistory();
    }
    return () => cleanupStream();
  }, [isOpen, pathId]);

  // Scroll to bottom on new messages / stream token
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedText, isStreaming]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/api/chat/${pathId}/history`);
      setMessages(res.data);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
      setErrorMsg('Failed to load chat history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const cleanupStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || inputMessage;
    if (!msg.trim() || isStreaming) return;

    setErrorMsg('');
    setInputMessage('');
    setIsStreaming(true);
    setStreamedText('');

    // Optimistically add user message to list
    const tempUserMsg = { id: 'temp-user', sender: 'USER', content: msg, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempUserMsg]);

    const { weekTheme, topicTitle } = activeContext || {};

    // Construct SSE URL
    const queryParams = new URLSearchParams({
      message: msg,
      weekTheme: weekTheme || '',
      topicTitle: topicTitle || '',
    });

    const sseUrl = `${API_BASE_URL}/api/chat/${pathId}/stream?${queryParams.toString()}`;

    // Establish EventSource with cookies enabled (withCredentials: true)
    const es = new EventSource(sseUrl, { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      // Direct token streaming data
      const token = event.data;
      setStreamedText((prev) => prev + token);
    };

    es.addEventListener('complete', () => {
      cleanupStream();
      setIsStreaming(false);
      setStreamedText('');
      // Refetch full history to replace optimistic message and sync database state
      fetchHistory();
    });

    es.onerror = (err) => {
      console.error('EventSource error:', err);
      cleanupStream();
      setIsStreaming(false);
      setErrorMsg('Lost connection to assistant. Please try again.');
    };
  };

  const handleSuggestedPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  // Simple custom Markdown / Code parser to avoid installing large libraries
  const renderMessageContent = (content) => {
    if (!content) return '';

    // Split content by markdown code blocks (```language ... ```)
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        // Extract language and code
        const lines = part.split('\n');
        const firstLine = lines[0];
        const lang = firstLine.replace('```', '').trim() || 'code';
        const code = lines.slice(1, lines.length - 1).join('\n');

        return (
          <pre 
            key={index} 
            className="my-3 p-4 bg-neutral-900 text-neutral-100 rounded-lg overflow-x-auto text-xs font-mono leading-relaxed border border-neutral-800"
          >
            <div className="flex justify-between items-center text-[10px] opacity-40 uppercase tracking-widest font-sans font-bold border-b border-neutral-800 pb-1.5 mb-2">
              <span>{lang}</span>
            </div>
            <code>{code}</code>
          </pre>
        );
      }

      // Format simple inline code `code`
      const inlineParts = part.split(/(`[^`]+`)/g);
      return (
        <span key={index}>
          {inlineParts.map((subPart, subIndex) => {
            if (subPart.startsWith('`') && subPart.endsWith('`')) {
              return (
                <code key={subIndex} className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-red-600 dark:text-red-400 rounded text-xs font-mono">
                  {subPart.slice(1, -1)}
                </code>
              );
            }
            return subPart;
          })}
        </span>
      );
    });
  };

  const suggestedPrompts = activeContext?.topicTitle
    ? [
        `Explain "${activeContext.topicTitle}" in simpler terms`,
        `Give me a coding exercise for "${activeContext.topicTitle}"`,
        `How is "${activeContext.topicTitle}" used in production?`,
      ]
    : [
        "Give me a study plan for this week",
        "Give me a quick 3-question quiz on our current topic",
        "Suggest a mini-project I can build with this skill",
      ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed md:relative top-0 right-0 w-full md:w-[400px] h-[100dvh] md:h-[calc(100vh-76px)] bg-[#F2F2EE] dark:bg-[#1C1C1A] border-l border-[#E5E5E4] dark:border-[#2A2A28] flex flex-col z-40 md:z-10 shadow-2xl md:shadow-none"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[#E5E5E4] dark:border-[#2A2A28] flex justify-between items-center bg-white dark:bg-[#111110]/40">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-accent" />
              <span className="font-heading font-bold text-base sm:text-lg">Pathways Assistant</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-850 rounded transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Active Context Bar */}
          {activeContext?.topicTitle && (
            <div className="px-5 py-2.5 bg-accent/10 border-b border-accent/20 flex justify-between items-center text-xs">
              <div className="truncate pr-3">
                <span className="font-bold text-accent uppercase tracking-wider text-[9px] block">Active Context</span>
                <span className="font-medium opacity-85 truncate block">
                  {activeContext.weekTheme} &gt; {activeContext.topicTitle}
                </span>
              </div>
              <button 
                onClick={onClearContext}
                className="text-accent font-semibold flex-shrink-0 hover:underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Messages Window */}
          <div className="flex-grow overflow-y-auto px-5 py-4 flex flex-col gap-4 custom-scrollbar">
            {isLoadingHistory && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-60">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3"></div>
                <span className="text-xs">Loading assistant history...</span>
              </div>
            ) : messages.length === 0 && !streamedText ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center py-10">
                <Sparkles className="w-10 h-10 text-accent opacity-50 mb-3" />
                <h4 className="font-heading text-lg mb-1">Ask anything</h4>
                <p className="text-xs opacity-60 max-w-[240px] leading-relaxed mb-6">
                  Get clarifications, code examples, or practice quizzes. Context is automatically synced.
                </p>

                {/* Suggested Prompts Grid */}
                <div className="flex flex-col gap-2.5 w-full max-w-[320px]">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      className="w-full text-left p-3 bg-white dark:bg-[#0D0D0C] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl text-xs hover:border-accent hover:bg-accent/5 transition duration-200"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isUser = msg.sender === 'USER';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col max-w-[85%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div 
                        className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                          isUser 
                            ? 'bg-neutral-200/60 dark:bg-neutral-850/60 text-[#192837] dark:text-[#EDEDED] rounded-tr-none' 
                            : 'bg-white dark:bg-[#0D0D0C] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-tl-none'
                        }`}
                      >
                        {renderMessageContent(msg.content)}
                      </div>
                      <span className="text-[10px] opacity-40 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {/* Stream Output */}
                {streamedText && (
                  <div className="flex flex-col max-w-[85%] self-start items-start">
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0D0D0C] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-tl-none text-sm leading-relaxed streaming-caret">
                      {renderMessageContent(streamedText)}
                    </div>
                    <span className="text-[10px] opacity-40 mt-1 px-1">Streaming...</span>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Suggested Prompts Footer (if chat has history) */}
          {messages.length > 0 && !isStreaming && (
            <div className="px-4 py-2 flex gap-2 overflow-x-auto whitespace-nowrap custom-scrollbar border-t border-[#E5E5E4]/60 dark:border-[#2A2A28]/40 bg-white/10">
              {suggestedPrompts.slice(0, 2).map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className="px-3 py-1.5 bg-white dark:bg-[#0D0D0C] border border-[#E5E5E4] dark:border-[#2A2A28] hover:border-accent rounded-full text-xs transition select-none flex-shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Form Input */}
          <div className="p-4 border-t border-[#E5E5E4] dark:border-[#2A2A28] bg-white dark:bg-[#111110]/40">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isStreaming}
                className="flex-grow px-4 py-3 text-xs sm:text-sm bg-white dark:bg-[#0D0D0C] border border-[#E5E5E4] dark:border-[#2A2A28] rounded-xl focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition disabled:opacity-50"
                placeholder={isStreaming ? "Streaming response..." : "Ask pathways assistant..."}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isStreaming}
                className="p-3 bg-accent text-white rounded-xl hover:brightness-110 active:scale-95 transition disabled:opacity-50 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
