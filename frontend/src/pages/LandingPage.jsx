import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, BookOpen, ArrowRightCircle, Compass, Sparkles, 
  Award, CheckCircle2, ChevronRight, MessageSquare, Play, 
  ExternalLink, Layers, Database, ShieldAlert, Cpu
} from 'lucide-react';
import Navbar from '../components/Navbar';
import CanvasBackground from '../components/CanvasBackground';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  // Interactive Timeline Mockup State
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [completedTopics, setCompletedTopics] = useState(new Set([1]));
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', content: 'Hi! I am your Pathways guide. Select any topic in the timeline, or ask me a question here to get started.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const mockCurriculum = {
    1: {
      theme: "Core Fundamentals & Setup",
      objectives: ["Set up local environments", "Learn variables and basic data types", "Control execution flow"],
      topics: [
        { id: 1, title: "Variables & Types", desc: "Understanding how variables store memory and primitive types.", url: "https://en.wikipedia.org/wiki/Data_type" },
        { id: 2, title: "Control Flow & Loops", desc: "Using if-else branches, for/while loops to control execution.", url: "https://en.wikipedia.org/wiki/Control_flow" },
        { id: 3, title: "Functions & Scope", desc: "Organizing code into functional blocks and understanding lexical scope.", url: "https://en.wikipedia.org/wiki/Scope_(computer_science)" }
      ]
    },
    2: {
      theme: "Object-Oriented Programming",
      objectives: ["Understand classes & objects", "Master inheritance", "Use interfaces for abstraction"],
      topics: [
        { id: 4, title: "Classes & Objects", desc: "Declaring blueprints and instantiating custom objects.", url: "https://en.wikipedia.org/wiki/Class_(computer_programming)" },
        { id: 5, title: "Inheritance & Polymorphism", desc: "Reusing code hierarchies and overriding parent method actions.", url: "https://en.wikipedia.org/wiki/Polymorphism_(computer_science)" },
        { id: 6, title: "Interfaces & Abstraction", desc: "Decoupling implementation using interfaces and abstract classes.", url: "https://en.wikipedia.org/wiki/Interface_(computing)" }
      ]
    },
    3: {
      theme: "Advanced Algorithms",
      objectives: ["Understand Big-O space/time complexity", "Implement lists and maps", "Explore trees and recursion"],
      topics: [
        { id: 7, title: "Time Complexity & Big-O", desc: "Measuring run-time growth of operations as input scales.", url: "https://en.wikipedia.org/wiki/Big_O_notation" },
        { id: 8, title: "HashMaps & Sets", desc: "Fast key-value pairings and duplicate element removal in O(1) time.", url: "https://en.wikipedia.org/wiki/Hash_table" }
      ]
    }
  };

  const handleTopicToggle = (id) => {
    const updated = new Set(completedTopics);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setCompletedTopics(updated);
  };

  // Calculate mock progress bar percentage
  const totalTopics = Object.values(mockCurriculum).reduce((acc, curr) => acc + curr.topics.length, 0);
  const progressPercentage = Math.round((completedTopics.size / totalTopics) * 100);

  const simulateStreamResponse = (prompt, responseText) => {
    if (isTyping) return;
    
    // Add user message
    setChatMessages((prev) => [...prev, { sender: 'user', content: prompt }]);
    setIsTyping(true);

    setTimeout(() => {
      // Create empty message for typing
      setChatMessages((prev) => [...prev, { sender: 'assistant', content: '' }]);
      
      const words = responseText.split(' ');
      let currentWordIndex = 0;
      let currentContent = '';

      const interval = setInterval(() => {
        if (currentWordIndex < words.length) {
          currentContent += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex];
          setChatMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { sender: 'assistant', content: currentContent };
            return updated;
          });
          currentWordIndex++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 70); // simulated typing delay
    }, 500);
  };

  const handleMockPrompt = (topicTitle) => {
    const prompt = `Explain "${topicTitle}" in simple terms.`;
    const responseText = `Sure! "${topicTitle}" is a fundamental coding block. When we use it, we build scalable architectures. In practical work, you want to write tests for it, keep functions pure, and keep complexities low (ideally O(1) or O(log N)). Use the documentation link in the timeline card to see exact syntax and standard library implementations.`;
    simulateStreamResponse(prompt, responseText);
  };

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/path/new');
    } else {
      navigate('/login?redirect=/path/new');
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    })
  };

  return (
    <div className="relative min-h-screen bg-[#0D0D0C] text-white overflow-x-hidden flex flex-col font-body">
      {/* Canvas Background with particles */}
      <CanvasBackground />

      {/* Grid Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Radial Spotlights */}
      <div className="absolute top-[10%] left-[50%] -translate-x-[50%] w-[500px] md:w-[800px] h-[350px] md:h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] bg-emerald-950/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Navbar */}
      <Navbar isLanding={true} />

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16 text-center flex flex-col items-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider text-accent uppercase"
          >
            <Sparkles size={12} className="animate-pulse" />
            <span>Resilient Multi-Service Architecture</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-heading text-4xl sm:text-5xl md:text-7xl leading-[1.05] tracking-tight font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 max-w-4xl"
          >
            Learn <span className="text-accent">Anything.</span> Fast.
            <br />
            Your AI-Generated Curriculum.
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-6 text-sm sm:text-base md:text-lg text-white/60 max-w-2xl font-light leading-relaxed"
          >
            Type in any skill or domain. Pathways instantly compiles a structured, weekly curriculum, fetches real tutorials & books in parallel, and opens a context-aware AI assistant.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleCtaClick}
              className="group flex items-center justify-between gap-8 py-3.5 px-6 min-w-[210px] bg-accent text-white text-sm font-semibold rounded-full border border-white/5 shadow-[0_4px_24px_rgba(79,121,66,0.35)] transition-all duration-300 hover:scale-[1.03] hover:brightness-[1.15] active:scale-[0.97] focus:outline-none"
            >
              <span>Start Learning Free</span>
              <ArrowRightCircle className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <a
              href="#interactive-demo"
              className="py-3.5 px-6 text-sm font-semibold text-white/80 hover:text-white transition duration-200"
            >
              Live Demo Preview ↓
            </a>
          </motion.div>
        </div>

        {/* Interactive Workspace Mockup */}
        <motion.div
          id="interactive-demo"
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-16 w-full max-w-5xl rounded-xl border border-white/10 bg-[#121211]/90 backdrop-blur-md shadow-2xl overflow-hidden text-left"
        >
          {/* Mock Window Header */}
          <div className="px-5 py-3 border-b border-white/5 bg-black/40 flex justify-between items-center">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="text-[11px] font-mono text-white/30 select-none">
              workspace/machine-learning-beginner
            </div>
            <div className="w-16" />
          </div>

          {/* Mock App Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
            {/* Left Column: Weeks Sidebar */}
            <div className="lg:col-span-3 border-r border-white/5 p-4 bg-black/15 flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 px-2">
                Curriculum Timeline
              </span>
              {[1, 2, 3].map((wk) => (
                <button
                  key={wk}
                  onClick={() => setSelectedWeek(wk)}
                  className={`w-full text-left p-3.5 rounded-lg border transition duration-200 ${
                    selectedWeek === wk
                      ? "bg-accent/10 border-accent/30 text-white"
                      : "bg-transparent border-transparent text-white/60 hover:bg-white/5"
                  }`}
                >
                  <div className="text-[10px] font-semibold text-accent uppercase">Week {wk}</div>
                  <div className="text-xs font-bold truncate">{mockCurriculum[wk].theme}</div>
                </button>
              ))}

              {/* Progress Summary Card */}
              <div className="mt-auto p-3.5 bg-white/5 border border-white/5 rounded-lg">
                <div className="flex justify-between items-center text-[10px] font-semibold text-white/60 mb-2">
                  <span>CURRICULUM PROGRESS</span>
                  <span className="text-accent font-bold">{progressPercentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                </div>
                <div className="text-[9px] text-white/40 mt-2">
                  {completedTopics.size} of {totalTopics} topics checked
                </div>
              </div>
            </div>

            {/* Middle Column: Current Week Details & Topics */}
            <div className="lg:col-span-5 p-6 flex flex-col gap-6 overflow-y-auto max-h-[500px]">
              <div>
                <div className="text-[10px] font-semibold text-accent uppercase tracking-wider">
                  Active Curated Week
                </div>
                <h3 className="font-heading text-xl mt-1 tracking-tight font-extrabold">
                  Week {selectedWeek}: {mockCurriculum[selectedWeek].theme}
                </h3>
              </div>

              {/* Objectives */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-lg">
                <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
                  Learning Objectives
                </div>
                <ul className="flex flex-col gap-1.5">
                  {mockCurriculum[selectedWeek].objectives.map((obj, i) => (
                    <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Topics Timeline */}
              <div className="flex flex-col gap-4">
                <div className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">
                  Topics to Master
                </div>
                <div className="flex flex-col gap-3">
                  {mockCurriculum[selectedWeek].topics.map((topic) => {
                    const isChecked = completedTopics.has(topic.id);
                    return (
                      <div
                        key={topic.id}
                        className={`p-4 border rounded-lg transition duration-200 ${
                          isChecked 
                            ? "bg-accent/5 border-accent/20" 
                            : "bg-white/5 border-white/5 hover:border-white/10"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => handleTopicToggle(topic.id)}
                            className="mt-0.5 text-white/40 hover:text-accent transition duration-150"
                          >
                            <CheckCircle2 
                              size={18} 
                              className={isChecked ? "text-accent fill-accent/20" : "text-white/20"} 
                            />
                          </button>
                          <div className="flex-grow">
                            <h4 className="text-xs font-bold flex items-center justify-between">
                              <span>{topic.title}</span>
                              <a
                                href={topic.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-accent font-semibold hover:underline flex items-center gap-0.5"
                              >
                                Docs <ExternalLink size={8} />
                              </a>
                            </h4>
                            <p className="text-[11px] text-white/50 mt-1 leading-relaxed">
                              {topic.desc}
                            </p>
                            <button
                              onClick={() => handleMockPrompt(topic.title)}
                              className="mt-2.5 inline-flex items-center gap-1 text-[10px] text-white/60 bg-white/5 border border-white/5 hover:bg-accent/15 hover:border-accent/20 hover:text-white px-2 py-1 rounded transition duration-150"
                            >
                              <MessageSquare size={10} />
                              Ask Guide Assistant
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: AI Assistant Drawer Mockup */}
            <div className="lg:col-span-4 border-l border-white/5 bg-black/20 p-5 flex flex-col max-h-[500px]">
              <div className="flex items-center gap-2 pb-3 border-b border-white/5">
                <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                  Pathways Assistant
                </span>
                <span className="text-[9px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded ml-auto">
                  Gemini-1.5
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-grow flex flex-col gap-3 py-4 overflow-y-auto custom-scrollbar select-none text-[11px]">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg max-w-[85%] leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-accent text-white self-end rounded-br-none'
                        : 'bg-white/5 border border-white/5 text-white/80 self-start rounded-bl-none'
                    }`}
                  >
                    {msg.content}
                    {isTyping && i === chatMessages.length - 1 && (
                      <span className="streaming-caret ml-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  disabled={isTyping}
                  onClick={() => handleMockPrompt(mockCurriculum[selectedWeek].topics[0].title)}
                  className="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md text-white/60 border border-white/5 hover:text-white transition"
                >
                  Explain topic →
                </button>
                <button
                  disabled={isTyping}
                  onClick={() => simulateStreamResponse("Give me a quiz on this week.", "Perfect! Let's do a quick quiz: What is the main difference between O(1) complexity and O(N) complexity? Take a guess, and explain your reasoning!")}
                  className="text-[9px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md text-white/60 border border-white/5 hover:text-white transition"
                >
                  Quiz me ⚡
                </button>
              </div>

              {/* Input Box Mockup */}
              <div className="p-2.5 bg-black/40 border border-white/5 rounded-lg flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about your path..."
                  disabled
                  className="bg-transparent border-none text-[11px] text-white/80 focus:outline-none flex-grow"
                />
                <button className="p-1 text-accent hover:brightness-110" disabled>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Feature Stats Grid */}
      <section className="relative z-10 w-full max-w-6xl mx-auto px-6 py-12 border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
            <h4 className="text-2xl font-bold font-heading text-accent">100%</h4>
            <p className="text-[10px] uppercase font-semibold text-white/40 tracking-wider mt-1">
              Custom Timelines
            </p>
          </div>
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
            <h4 className="text-2xl font-bold font-heading text-accent">Real-Time</h4>
            <p className="text-[10px] uppercase font-semibold text-white/40 tracking-wider mt-1">
              YouTube & Book Curations
            </p>
          </div>
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
            <h4 className="text-2xl font-bold font-heading text-accent">Resilient</h4>
            <p className="text-[10px] uppercase font-semibold text-white/40 tracking-wider mt-1">
              Offline Mock Fallback
            </p>
          </div>
          <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
            <h4 className="text-2xl font-bold font-heading text-accent">&lt; 3 Sec</h4>
            <p className="text-[10px] uppercase font-semibold text-white/40 tracking-wider mt-1">
              Generation Speed
            </p>
          </div>
        </div>
      </section>

      {/* Architecture / How It Works Section */}
      <section id="how-it-works" className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Robust Design Principles
          </span>
          <h2 className="font-heading text-3xl md:text-4xl tracking-tight font-extrabold mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Curate. Learn. Adapt.
          </h2>
          <p className="text-sm text-white/50 max-w-lg mx-auto mt-3 font-light">
            Behind the clean aesthetic lies a scalable microservice architecture engineered for high availability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 transition duration-300 flex flex-col">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent w-fit mb-6">
              <Compass size={22} />
            </div>
            <h3 className="text-base font-bold mb-2">1. Define Your Target</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Enter any technical, programming, or creative skill. Select your capability level and input personal milestones (e.g., job preparation).
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 transition duration-300 flex flex-col">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent w-fit mb-6">
              <Layers size={22} />
            </div>
            <h3 className="text-base font-bold mb-2">2. Parallel Enrichment</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              The generator structures weekly timelines while backend processes call the YouTube and Google Books API in parallel to query real reference materials.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 transition duration-300 flex flex-col">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent w-fit mb-6">
              <Award size={22} />
            </div>
            <h3 className="text-base font-bold mb-2">3. Active Study Co-Pilot</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Follow your interactive checklist, checking off complete modules. Slide open the assistant side drawer to run mini-tests or clarify syntax block-by-block.
            </p>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 text-center text-xs text-white/30">
        &copy; {new Date().getFullYear()} Pathways. Portfolio project designed with intent, care, and taste.
      </footer>
    </div>
  );
}
