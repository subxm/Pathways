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

const curriculaData = {
  ml: {
    1: {
      theme: "Mathematics & Python Setup",
      objectives: ["Review linear algebra basics", "Configure NumPy & Pandas libraries", "Plot equations using Matplotlib"],
      topics: [
        { id: 1, title: "Linear Algebra & Matrices", desc: "Understanding vectors, matrix multiplication, and systems of linear equations.", url: "https://en.wikipedia.org/wiki/Linear_algebra" },
        { id: 2, title: "Data Wrangling with NumPy", desc: "Performing vectorized operations on multi-dimensional matrices and arrays.", url: "https://en.wikipedia.org/wiki/NumPy" },
        { id: 3, title: "Plotting & Visualization", desc: "Using Matplotlib and Seaborn to visualize data distributions and gradients.", url: "https://en.wikipedia.org/wiki/Matplotlib" }
      ]
    },
    2: {
      theme: "Supervised Learning Models",
      objectives: ["Master linear & logistic regression", "Implement gradient descent", "Understand bias-variance tradeoffs"],
      topics: [
        { id: 4, title: "Linear Regression", desc: "Fitting a linear model using ordinary least squares regression metrics.", url: "https://en.wikipedia.org/wiki/Linear_regression" },
        { id: 5, title: "Gradient Descent Algorithm", desc: "Optimizing cost function parameters using partial derivative slope calculations.", url: "https://en.wikipedia.org/wiki/Gradient_descent" }
      ]
    },
    3: {
      theme: "Neural Networks & Deep Learning",
      objectives: ["Build multi-layer perceptrons", "Understand forward and backpropagation", "Design neural activation nodes"],
      topics: [
        { id: 6, title: "Multi-Layer Perceptrons", desc: "Structuring input, hidden, and output dense layers with nodes.", url: "https://en.wikipedia.org/wiki/Multilayer_perceptron" },
        { id: 7, title: "Backpropagation math", desc: "Using chain-rule derivatives to calculate error gradients and update weights.", url: "https://en.wikipedia.org/wiki/Backpropagation" }
      ]
    }
  },
  react: {
    1: {
      theme: "React Core Concepts & JSX",
      objectives: ["Understand declarative rendering", "Create reusable React components", "Master JSX expressions & syntax"],
      topics: [
        { id: 10, title: "Declarative Rendering", desc: "Understanding how React syncs the virtual DOM with actual browser nodes.", url: "https://react.dev/learn" },
        { id: 11, title: "JSX Syntax Basics", desc: "Writing markup embedded in Javascript code using Babel transpiler rules.", url: "https://react.dev/learn/writing-markup-with-jsx" }
      ]
    },
    2: {
      theme: "State & Hooks Lifecycle",
      objectives: ["Manage local state with useState", "Synchronize effects with useEffect", "Track references with useRef"],
      topics: [
        { id: 12, title: "useState Hook", desc: "Declaring state variables inside components to preserve values across renders.", url: "https://react.dev/reference/react/useState" },
        { id: 13, title: "useEffect Hook", desc: "Executing side effects like data fetching or event listeners on mount.", url: "https://react.dev/reference/react/useEffect" }
      ]
    },
    3: {
      theme: "Global State & Performance",
      objectives: ["Understand Context API", "Build state trees with Zustand", "Optimize rendering using React.memo"],
      topics: [
        { id: 14, title: "Zustand State Store", desc: "Setting up a clean external store to rotate actions and global variables.", url: "https://github.com/pmndrs/zustand" },
        { id: 15, title: "React.memo & callbacks", desc: "Preventing unnecessary re-renders of child components using memoization.", url: "https://react.dev/reference/react/memo" }
      ]
    }
  },
  writing: {
    1: {
      theme: "Story Structure & Outlines",
      objectives: ["Deconstruct the Three-Act structure", "Build compelling character bios", "Draft initial plotting outlines"],
      topics: [
        { id: 20, title: "Three-Act Structure", desc: "Structuring narrative setup, confrontation, and final resolution milestones.", url: "https://en.wikipedia.org/wiki/Three-act_structure" },
        { id: 21, title: "Character Arc Blueprints", desc: "Designing motivations, flaws, and transformation milestones for characters.", url: "https://en.wikipedia.org/wiki/Character_arc" }
      ]
    },
    2: {
      theme: "Pacing & Show vs. Tell",
      objectives: ["Master high-action scene pacing", "Convert exposition to sensory action", "Write sharp dialogue trees"],
      topics: [
        { id: 22, title: "Show, Don't Tell", desc: "Immersing readers in actions and feelings rather than summaries.", url: "https://en.wikipedia.org/wiki/Show,_don%27t_tell" },
        { id: 23, title: "Dialogue beats & pacing", desc: "Adding character micro-actions to dialogue lines to build tension.", url: "https://en.wikipedia.org/wiki/Dialogue_in_writing" }
      ]
    },
    3: {
      theme: "Editing & Publishing Prep",
      objectives: ["Prune unnecessary filler words", "Format manuscripts standardly", "Write query letters for agents"],
      topics: [
        { id: 24, title: "Manuscript Revision", desc: "Conducting developmental edits and line-by-line grammar polish.", url: "https://en.wikipedia.org/wiki/Editing" },
        { id: 25, title: "Querying Literary Agents", desc: "Writing structured pitch letters and synopses to secure representation.", url: "https://en.wikipedia.org/wiki/Publishing" }
      ]
    }
  }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  // Interactive Timeline Mockup State
  const [activeSubject, setActiveSubject] = useState('ml');
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [completedTopics, setCompletedTopics] = useState(new Set([1]));
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', content: 'Hi! I am your Pathways guide. Select any topic in the timeline, or ask me a question here to get started.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "How does Pathways generate these learning curriculums?",
      a: "Pathways sends structured prompt parameters to the Gemini API which parses your subject, level, and goals. It generates a comprehensive JSON response detailing weekly topics, objectives, and official reference documents."
    },
    {
      q: "Do I need my own developer API keys to preview the platform?",
      a: "No! Pathways runs with a robust backend fallback architecture. If downstream API keys are not supplied by the developer, the platform falls back to pre-configured high-fidelity tracks (like React or Machine Learning) and streams simulated interactive study help in real time."
    },
    {
      q: "How does the assistant stream interactive answers?",
      a: "The assistant uses a reactive stream connected to our downstream chat-service, processing prompt contexts on-the-fly to clarify code syntax, answer theoretical questions, or generate dynamic quizzes."
    },
    {
      q: "Can I save my progress and track multiple subjects?",
      a: "Yes! Once signed in, all your custom generated learning paths and checkboxes are stored securely in our Neon Postgres database. You can manage multiple paths concurrently directly from your dashboard."
    }
  ];

  const handleSubjectChange = (subjKey) => {
    setActiveSubject(subjKey);
    setSelectedWeek(1);
    const defaults = { ml: 1, react: 10, writing: 20 };
    setCompletedTopics(new Set([defaults[subjKey]]));
    setChatMessages([
      { sender: 'assistant', content: `Hi! I am your Pathways guide for ${subjKey === 'ml' ? 'Machine Learning' : subjKey === 'react' ? 'React Development' : 'Creative Writing'}. Select any topic in the timeline, or ask me a question here to get started.` }
    ]);
  };

  const mockCurriculum = curriculaData[activeSubject];

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
      {/* Grid Mesh Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Radial Spotlights */}
      <div className="absolute top-[10%] left-[50%] -translate-x-[50%] w-[500px] md:w-[800px] h-[350px] md:h-[500px] bg-accent/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[-10%] w-[300px] md:w-[500px] h-[300px] bg-emerald-950/10 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Navbar */}
      <Navbar isLanding={true} />

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16 text-center flex flex-col items-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Title */}
          <motion.h1
            custom={0}
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
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-6 text-sm sm:text-base md:text-lg text-white/60 max-w-2xl font-light leading-relaxed"
          >
            Type in any skill or domain. Pathways instantly compiles a structured, weekly curriculum, fetches real tutorials & books in parallel, and opens a context-aware AI assistant.
          </motion.p>

          {/* CTAs */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button
              onClick={handleCtaClick}
              className="py-3.5 px-8 bg-accent text-white text-sm font-semibold rounded-lg border border-white/5 shadow-[0_4px_24px_rgba(79,121,66,0.25)] transition-all duration-300 hover:scale-[1.03] hover:brightness-[1.15] active:scale-[0.97] focus:outline-none"
            >
              Start Learning Free
            </button>
            <a
              href="#interactive-demo"
              className="py-3.5 px-8 text-sm font-semibold text-white/80 hover:text-white bg-white/5 border border-white/10 rounded-lg transition-all duration-300 hover:scale-[1.03] hover:bg-white/10 active:scale-[0.97]"
            >
              Live Demo Preview
            </a>
          </motion.div>
        </div>

        {/* Playground Selector Tabs */}
        <motion.div
          custom={2.5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-16 flex flex-wrap gap-2.5 justify-center items-center relative z-10"
        >
          <span className="text-xs font-semibold text-white/40 uppercase tracking-wider mr-2">
            Select a path to preview:
          </span>
          {[
            { key: 'ml', label: 'Machine Learning Foundations' },
            { key: 'react', label: 'React Web Apps' },
            { key: 'writing', label: 'Creative Fiction Writing' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleSubjectChange(item.key)}
              className={`py-2 px-5 text-xs font-bold rounded-lg border transition duration-200 ${
                activeSubject === item.key
                  ? 'bg-accent/15 border-accent text-white shadow-[0_2px_12px_rgba(79,121,66,0.15)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </motion.div>

        {/* Interactive Workspace Mockup */}
        <motion.div
          id="interactive-demo"
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-6 w-full max-w-5xl rounded-xl border border-white/10 bg-[#121211]/90 backdrop-blur-md shadow-2xl overflow-hidden text-left"
        >
          {/* Mock Window Header */}
          <div className="px-5 py-3 border-b border-white/5 bg-black/40 flex justify-between items-center">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="text-[11px] font-mono text-white/30 select-none">
              workspace/{activeSubject === 'ml' ? 'machine-learning-beginner' : activeSubject === 'react' ? 'react-web-apps' : 'creative-fiction-writing'}
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
            <div className="lg:col-span-5 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar max-h-[500px]">
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
              </div>

              {/* Chat Messages */}
              <div className="flex-grow flex flex-col gap-3 py-4 overflow-y-auto no-scrollbar select-none text-[11px]">
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

      {/* Features Section */}
      <motion.section 
        id="features" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Key Features
          </span>
          <h2 className="font-heading text-3xl md:text-4xl tracking-tight font-extrabold mt-2">
            Engineered for Deep Learning
          </h2>
          <p className="text-sm text-white/50 max-w-lg mx-auto mt-3 font-light">
            An all-in-one AI study platform designed to simplify complex subjects.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 hover:bg-white/[0.02] transition duration-300 flex flex-col items-start">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent mb-6">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-bold mb-2">Smart JSON Timelines</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Enter any discipline and watch our engine partition complex goals into beautifully structured, bite-sized weekly milestones.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 hover:bg-white/[0.02] transition duration-300 flex flex-col items-start">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent mb-6">
              <MessageSquare size={20} />
            </div>
            <h3 className="text-base font-bold mb-2">Contextual AI Co-Pilot</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Got stuck on a tricky module? Slide open the context-aware Gemini study guide to run diagnostic quizzes or explain code blocks.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 hover:bg-white/[0.02] transition duration-300 flex flex-col items-start">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent mb-6">
              <BookOpen size={20} />
            </div>
            <h3 className="text-base font-bold mb-2">Media Enrichment</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Automatically crawls, filters, and binds high-quality YouTube lecture videos and Google Books references directly to corresponding steps.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 hover:bg-white/[0.02] transition duration-300 flex flex-col items-start">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent mb-6">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="text-base font-bold mb-2">Progress Checklists</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Interactive checkboxes capture your completions locally, keeping your dashboard updated and maintaining momentum through your path.
            </p>
          </div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <motion.section 
        id="how-it-works" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5"
      >
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
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 hover:bg-white/[0.02] transition duration-300 flex flex-col items-center text-center">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent mb-6">
              <Compass size={22} />
            </div>
            <h3 className="text-base font-bold mb-2">1. Define Your Target</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Enter any technical, programming, or creative skill. Select your capability level and input personal milestones (e.g., job preparation).
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 hover:bg-white/[0.02] transition duration-300 flex flex-col items-center text-center">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent mb-6">
              <Layers size={22} />
            </div>
            <h3 className="text-base font-bold mb-2">2. Parallel Enrichment</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              The generator structures weekly timelines while backend processes call the YouTube and Google Books API in parallel to query real reference materials.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-xl hover:border-accent/40 hover:bg-white/[0.02] transition duration-300 flex flex-col items-center text-center">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent mb-6">
              <Award size={22} />
            </div>
            <h3 className="text-base font-bold mb-2">3. Active Study Co-Pilot</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">
              Follow your interactive checklist, checking off complete modules. Slide open the assistant side drawer to run mini-tests or clarify syntax block-by-block.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Featured Resources Showcase */}
      <motion.section 
        id="resources" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Curated Resources
          </span>
          <h2 className="font-heading text-3xl md:text-4xl tracking-tight font-extrabold mt-2">
            Enriched Learning Materials
          </h2>
          <p className="text-sm text-white/50 max-w-lg mx-auto mt-3 font-light">
            Every step is enriched with high-quality learning materials pulled in parallel to reinforce visual and textual studying.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lecture Videos Mockup */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Auto-Fetched Video Lectures
                </span>
                <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-mono">
                  YouTube API
                </span>
              </div>
              
              <div className="flex flex-col gap-4">
                {/* Mock Video Item 1 */}
                <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex gap-4 items-center">
                  <div className="w-24 aspect-video bg-neutral-800 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent opacity-50" />
                    <Play size={16} className="text-accent fill-accent/20" />
                    <span className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[8px] font-mono text-white/80">
                      14:22
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">Linear Algebra Foundations: Matrices & Transforms</h4>
                    <p className="text-[10px] text-white/40 mt-1">3Blue1Brown • 2.4M views</p>
                  </div>
                </div>

                {/* Mock Video Item 2 */}
                <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex gap-4 items-center">
                  <div className="w-24 aspect-video bg-neutral-800 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 border border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-transparent opacity-50" />
                    <Play size={16} className="text-accent fill-accent/20" />
                    <span className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[8px] font-mono text-white/80">
                      28:45
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">NumPy Array Operations & Indexing Tutorial</h4>
                    <p className="text-[10px] text-white/40 mt-1">freeCodeCamp • 180k views</p>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-white/40 mt-6 leading-relaxed">
              Videos are queried dynamically matching week themes and sorted by relevance and view count to guarantee high-quality visual aids.
            </p>
          </div>

          {/* Reference Books Mockup */}
          <div className="p-6 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Recommended Literature
                </span>
                <span className="text-[10px] bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded font-mono">
                  Google Books API
                </span>
              </div>
              
              <div className="flex flex-col gap-4">
                {/* Mock Book Item 1 */}
                <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex gap-4 items-center">
                  <div className="w-12 h-16 bg-neutral-800 rounded-md flex items-center justify-center shrink-0 border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-4 bg-accent/20" />
                    <span className="text-[7px] font-mono text-white/40 text-center px-1 font-bold">PYTHON ML</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">Python Machine Learning: Machine Learning & Deep Learning</h4>
                    <p className="text-[10px] text-white/40 mt-1">Sebastian Raschka • Packt Publishing</p>
                  </div>
                </div>

                {/* Mock Book Item 2 */}
                <div className="p-3 bg-black/30 border border-white/5 rounded-xl flex gap-4 items-center">
                  <div className="w-12 h-16 bg-neutral-800 rounded-md flex items-center justify-center shrink-0 border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-4 bg-accent/20" />
                    <span className="text-[7px] font-mono text-white/40 text-center px-1 font-bold">MATH FOR ML</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">Mathematics for Machine Learning</h4>
                    <p className="text-[10px] text-white/40 mt-1">Marc Peter Deisenroth • Cambridge Press</p>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-white/40 mt-6 leading-relaxed">
              Google Books integration retrieves academic references, textbook breakdowns, and publisher literature for deep-dive theoretical support.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Curated Subject Library Grid */}
      <motion.section 
        id="library" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Subject Library
          </span>
          <h2 className="font-heading text-3xl md:text-4xl tracking-tight font-extrabold mt-2">
            Explore Popular Pathways
          </h2>
          <p className="text-sm text-white/50 max-w-lg mx-auto mt-3 font-light">
            Select a curated subject template below to preview it instantly in the interactive workspace above.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Software Engineering */}
          <div 
            onClick={() => {
              handleSubjectChange('react');
              document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`p-6 bg-white/5 border rounded-xl cursor-pointer transition duration-300 hover:bg-white/[0.02] flex flex-col justify-between ${
              activeSubject === 'react' ? 'border-accent shadow-[0_4px_20px_rgba(79,121,66,0.15)]' : 'border-white/5 hover:border-accent/40'
            }`}
          >
            <div>
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent w-fit mb-6">
                <Cpu size={22} />
              </div>
              <h3 className="text-lg font-bold mb-2">React Web Apps</h3>
              <p className="text-xs text-white/50 leading-relaxed font-light mb-4">
                Master virtual DOM structures, React hook lifecycles, and modern global state engines like Zustand.
              </p>
            </div>
            <div className="text-[10px] uppercase font-bold text-accent tracking-wider">
              {activeSubject === 'react' ? 'Active Preview • Scroll Up' : 'Load Template →'}
            </div>
          </div>

          {/* Card 2: Data Science & AI */}
          <div 
            onClick={() => {
              handleSubjectChange('ml');
              document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`p-6 bg-white/5 border rounded-xl cursor-pointer transition duration-300 hover:bg-white/[0.02] flex flex-col justify-between ${
              activeSubject === 'ml' ? 'border-accent shadow-[0_4px_20px_rgba(79,121,66,0.15)]' : 'border-white/5 hover:border-accent/40'
            }`}
          >
            <div>
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent w-fit mb-6">
                <Database size={22} />
              </div>
              <h3 className="text-lg font-bold mb-2">Machine Learning Foundations</h3>
              <p className="text-xs text-white/50 leading-relaxed font-light mb-4">
                Explore regression math, gradient descent calculations, and multi-layer deep neural networks.
              </p>
            </div>
            <div className="text-[10px] uppercase font-bold text-accent tracking-wider">
              {activeSubject === 'ml' ? 'Active Preview • Scroll Up' : 'Load Template →'}
            </div>
          </div>

          {/* Card 3: Creative Arts */}
          <div 
            onClick={() => {
              handleSubjectChange('writing');
              document.getElementById('interactive-demo')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`p-6 bg-white/5 border rounded-xl cursor-pointer transition duration-300 hover:bg-white/[0.02] flex flex-col justify-between ${
              activeSubject === 'writing' ? 'border-accent shadow-[0_4px_20px_rgba(79,121,66,0.15)]' : 'border-white/5 hover:border-accent/40'
            }`}
          >
            <div>
              <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-accent w-fit mb-6">
                <Sparkles size={22} />
              </div>
              <h3 className="text-lg font-bold mb-2">Creative Fiction Writing</h3>
              <p className="text-xs text-white/50 leading-relaxed font-light mb-4">
                Deconstruct character arcs, story setup structure, dialogue beats, and literary query techniques.
              </p>
            </div>
            <div className="text-[10px] uppercase font-bold text-accent tracking-wider">
              {activeSubject === 'writing' ? 'Active Preview • Scroll Up' : 'Load Template →'}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Before & After Contrast Section */}
      <motion.section 
        id="comparison" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/5"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            Study Comparison
          </span>
          <h2 className="font-heading text-3xl md:text-4xl tracking-tight font-extrabold mt-2">
            The Studying Upgrade
          </h2>
          <p className="text-sm text-white/50 max-w-lg mx-auto mt-3 font-light">
            Compare the struggle of traditional self-directed research against the consolidated Pathways model.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional Way */}
          <div className="p-8 bg-red-950/10 border border-red-500/10 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="w-fit px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6">
                Traditional Studying
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Tab Overload & Friction</h3>
              <ul className="flex flex-col gap-3.5">
                <li className="text-xs text-white/60 flex items-start gap-2.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span>Scattering bookmarks across dozens of blogs, wikis, and documentation tabs.</span>
                </li>
                <li className="text-xs text-white/60 flex items-start gap-2.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span>Wasting hours weeding out outdated or irrelevant YouTube lecture playlists.</span>
                </li>
                <li className="text-xs text-white/60 flex items-start gap-2.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span>No feedback loop when code breaks or conceptual definitions feel confusing.</span>
                </li>
                <li className="text-xs text-white/60 flex items-start gap-2.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span>Losing track of progress and motivation with static, non-interactive checklists.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 text-xs text-red-400/50 font-mono">
              Result: Constant context-switching, low retention.
            </div>
          </div>

          {/* Pathways Way */}
          <div className="p-8 bg-emerald-950/10 border border-accent/20 rounded-2xl flex flex-col justify-between shadow-[0_4px_24px_rgba(79,121,66,0.05)]">
            <div>
              <div className="w-fit px-3 py-1 bg-accent/20 border border-accent/30 text-accent rounded-full text-[10px] font-bold uppercase tracking-wider mb-6">
                The Pathways Way
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Centralized AI Classrooms</h3>
              <ul className="flex flex-col gap-3.5">
                <li className="text-xs text-white/80 flex items-start gap-2.5">
                  <span className="text-accent font-bold mt-0.5">✓</span>
                  <span>One single structured timeline mapping out your entire learning journey.</span>
                </li>
                <li className="text-xs text-white/80 flex items-start gap-2.5">
                  <span className="text-accent font-bold mt-0.5">✓</span>
                  <span>Parallel resource fetching brings targeted lectures and books directly to your desk.</span>
                </li>
                <li className="text-xs text-white/80 flex items-start gap-2.5">
                  <span className="text-accent font-bold mt-0.5">✓</span>
                  <span>Context-aware Gemini assistant streams quizzes, syntax checks, and debugs.</span>
                </li>
                <li className="text-xs text-white/80 flex items-start gap-2.5">
                  <span className="text-accent font-bold mt-0.5">✓</span>
                  <span>Interactive checklists persist state, showing your learning speed grow.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 text-xs text-accent/80 font-mono">
              Result: Zero friction, accelerated mastery.
            </div>
          </div>
        </div>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        id="faq" 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl mx-auto px-6 py-20 border-t border-white/5"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-accent uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="font-heading text-3xl md:text-4xl tracking-tight font-extrabold mt-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-white/50 max-w-lg mx-auto mt-3 font-light">
            Everything you need to know about setting up and using the Pathways platform.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index} 
                className="bg-white/5 border border-white/5 rounded-xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-white/[0.02] transition"
                >
                  <span className="text-sm sm:text-base font-bold text-white/90">
                    {faq.q}
                  </span>
                  <ChevronRight 
                    size={18} 
                    className={`text-white/60 transition-transform duration-300 ${isOpen ? 'rotate-90 text-accent' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="p-6 pt-0 border-t border-white/5 text-xs sm:text-sm text-white/60 leading-relaxed font-light">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* Bottom CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-20"
      >
        <div className="relative overflow-hidden p-8 md:p-12 bg-gradient-to-br from-accent/15 via-white/[0.02] to-transparent border border-white/5 rounded-2xl text-center flex flex-col items-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(79,121,66,0.15),transparent_60%)] pointer-events-none" />
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl tracking-tight font-extrabold text-white max-w-xl leading-tight">
            Ready to accelerate your learning?
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-white/50 max-w-md font-light leading-relaxed">
            Create structured weekly milestones for any topic, get parallel materials, and study with an active AI guide.
          </p>
          <button
            onClick={handleCtaClick}
            className="mt-8 py-3.5 px-8 bg-accent text-white text-sm font-semibold rounded-lg border border-white/5 shadow-[0_4px_24px_rgba(79,121,66,0.25)] transition-all duration-300 hover:scale-[1.03] hover:brightness-[1.15] active:scale-[0.97] focus:outline-none"
          >
            Start Learning Free
          </button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 text-center text-xs text-white/30">
        &copy; {new Date().getFullYear()} Pathways.
      </footer>
    </div>
  );
}
