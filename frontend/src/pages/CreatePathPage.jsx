import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookOpen, Sparkles, AlertCircle, ArrowLeft, ArrowRight, Check, Clock, Code, FileText, GraduationCap, Laptop } from 'lucide-react';
import { usePathStore } from '../store/pathStore';
import Navbar from '../components/Navbar';

export default function CreatePathPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [skill, setSkill] = useState(searchParams.get('skill') || '');
  const [level, setLevel] = useState('Beginner');
  const [goal, setGoal] = useState('');
  const [studyHours, setStudyHours] = useState('4-7 hours/week (Medium)');
  const [learningStyle, setLearningStyle] = useState('Practical (hands-on building, projects)');
  const [error, setError] = useState('');
  
  const { generatePath, isGeneratingPath } = usePathStore();
  const navigate = useNavigate();

  const handleNext = () => {
    if (step === 1 && !skill.trim()) {
      setError('Please enter a skill you want to learn.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!skill.trim()) {
      setError('Please enter a skill you want to learn.');
      setStep(1);
      return;
    }

    const res = await generatePath(
      skill.trim(), 
      level, 
      goal.trim() || 'General study and mastery', 
      studyHours, 
      learningStyle
    );

    if (res.success) {
      navigate(`/path/${res.path.id}`);
    } else {
      setError(res.message);
    }
  };

  const skillSuggestions = ['React', 'Rust', 'Docker', 'Machine Learning', 'Python', 'Next.js', 'TypeScript', 'SQL'];
  const goalSuggestions = ['Build a portfolio project', 'Prepare for job interviews', 'Master the theoretical core', 'Deploy a production application', 'Learn from first principles'];

  // Loading Screen
  if (isGeneratingPath) {
    return (
      <div className="min-h-screen bg-[#0D0D0C] text-white flex flex-col justify-center items-center px-6 relative overflow-hidden">
        <div className="max-w-[400px] w-full text-center flex flex-col items-center relative z-10">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mb-6"></div>
          
          <h2 className="font-heading text-2xl tracking-tight mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            Curating Learning Path
          </h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            Structuring a personalized timeline based on your experience, schedule, and preferred study style.
          </p>

          <div className="w-full text-left bg-white/[0.02] border border-white/5 rounded-xl p-5 flex flex-col gap-3.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-accent">●</span>
              <span className="font-semibold text-white">Designing customized week-by-week goals...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-accent animate-pulse">●</span>
              <span className="text-white/70">Scanning YouTube lecture databases for video resources...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/30">●</span>
              <span className="text-white/40">Fetching official documentation specifications...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/30">●</span>
              <span className="text-white/40">Generating active code exercises and project prompts...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const progressPercent = Math.round(((step - 1) / 5) * 100);

  return (
    <div className="min-h-screen bg-[#0D0D0C] text-white flex flex-col relative overflow-hidden font-body">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-6 py-12 relative z-10 mt-16">
        <div className="w-full max-w-[550px] p-8 bg-[#121211]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl transition-all duration-300">
          
          {/* Header & Progress Indicator */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">AI Intake Onboarding</span>
            </div>
            <span className="text-xs text-white/40 font-semibold font-mono">Step {step} of 6</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-8">
            <div 
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {error && (
            <div className="p-3 mb-6 text-xs font-semibold bg-red-950/40 text-red-400 border border-red-900 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Skill/Topic */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right duration-250">
              <h2 className="font-heading text-2xl tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                What skill or topic would you like to master?
              </h2>
              <p className="text-xs text-white/50 mb-6 font-medium">Enter any topic—from web frameworks and languages to complex science concepts.</p>
              
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-medium text-white placeholder-white/30 text-sm mb-4"
                placeholder="e.g. Docker, Rust Programming, Deep Learning..."
                maxLength={80}
              />

              <div className="flex flex-wrap gap-2 mb-8">
                {skillSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSkill(s)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition font-medium ${
                      skill === s 
                        ? 'bg-accent/20 border-accent text-accent' 
                        : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={!skill.trim()}
                className="w-full py-3.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-98 transition flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* STEP 2: Experience Level */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right duration-250">
              <h2 className="font-heading text-2xl tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                What is your experience with {skill}?
              </h2>
              <p className="text-xs text-white/50 mb-6 font-medium">We'll adjust the starting point and terminology complexity based on your answer.</p>

              <div className="flex flex-col gap-3.5 mb-8">
                {[
                  { value: 'Beginner', desc: 'Brand new to this skill. Start with first principles and the basic concepts.' },
                  { value: 'Intermediate', desc: 'Know some basics. Skip the initial introductions and jump to hands-on build topics.' },
                  { value: 'Advanced', desc: 'Already comfortable. Design a rigorous timeline focusing on optimization and system design.' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setLevel(item.value)}
                    className={`p-4 rounded-xl border text-left transition flex items-start gap-3.5 ${
                      level === item.value 
                        ? 'bg-accent/10 border-accent/70' 
                        : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition ${
                      level === item.value ? 'border-accent bg-accent text-white' : 'border-white/20'
                    }`}>
                      {level === item.value && <Check size={12} />}
                    </div>
                    <div>
                      <span className="font-bold text-sm block text-white mb-0.5">{item.value}</span>
                      <span className="text-xs text-white/50 leading-relaxed block font-medium">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3.5 bg-white/5 border border-white/5 text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold rounded-lg transition flex justify-center items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-98 transition flex justify-center items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Specific Goal */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right duration-250">
              <h2 className="font-heading text-2xl tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                What is your primary goal or target project?
              </h2>
              <p className="text-xs text-white/50 mb-6 font-medium">Describe what you want to achieve or build. The AI will custom-tailored topics to support this goal.</p>

              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-medium text-white placeholder-white/30 text-sm mb-4"
                placeholder="e.g. Build an API, Prep for a technical interview, Code a web app..."
                maxLength={120}
              />

              <div className="flex flex-wrap gap-2 mb-8">
                {goalSuggestions.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition font-medium text-left ${
                      goal === g 
                        ? 'bg-accent/20 border-accent text-accent' 
                        : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3.5 bg-white/5 border border-white/5 text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold rounded-lg transition flex justify-center items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-98 transition flex justify-center items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Study Commitment */}
          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-right duration-250">
              <h2 className="font-heading text-2xl tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                How much time can you dedicate per week?
              </h2>
              <p className="text-xs text-white/50 mb-6 font-medium">This dictates the length and curriculum density so it matches your life schedule.</p>

              <div className="flex flex-col gap-3.5 mb-8">
                {[
                  { value: '1-3 hours/week (Light)', desc: 'Focus on absolute essentials. Slower weekly pacing, perfect for busy professionals.' },
                  { value: '4-7 hours/week (Medium)', desc: 'Balanced timeline. Structured, steady progress of 1 core subtopic per session.' },
                  { value: '8-15 hours/week (Intense)', desc: 'Faster curriculum advancement. Focuses on deep conceptual builds and tasks.' },
                  { value: '15+ hours/week (Full-time)', desc: 'Maximum depth. A comprehensive, challenging, immersive training plan.' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStudyHours(item.value)}
                    className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3.5 ${
                      studyHours === item.value 
                        ? 'bg-accent/10 border-accent/70' 
                        : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition ${
                      studyHours === item.value ? 'border-accent bg-accent text-white' : 'border-white/20'
                    }`}>
                      {studyHours === item.value && <Check size={12} />}
                    </div>
                    <div>
                      <span className="font-bold text-sm block text-white mb-0.5">{item.value}</span>
                      <span className="text-xs text-white/50 leading-relaxed block font-medium">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3.5 bg-white/5 border border-white/5 text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold rounded-lg transition flex justify-center items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-98 transition flex justify-center items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Learning Style */}
          {step === 5 && (
            <div className="animate-in fade-in slide-in-from-right duration-250">
              <h2 className="font-heading text-2xl tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                What is your preferred learning style?
              </h2>
              <p className="text-xs text-white/50 mb-6 font-medium">We will format descriptions and tasks to match how you process information best.</p>

              <div className="flex flex-col gap-3.5 mb-8">
                {[
                  { value: 'Practical (hands-on building, projects)', icon: <Code size={16} className="text-accent" />, desc: 'Emphasize weekly application tasks, live building projects, and coding exercises.' },
                  { value: 'Visual/Structured (video courses, tutorials)', icon: <Laptop size={16} className="text-accent" />, desc: 'Curate video walkthroughs, sequential tutorials, and visual learning materials.' },
                  { value: 'Reference-Heavy (official documentation, articles)', icon: <FileText size={16} className="text-accent" />, desc: 'Focus heavily on reading specifications, manuals, documentation, and technical articles.' },
                  { value: 'Theoretical (academic papers, textbooks)', icon: <GraduationCap size={16} className="text-accent" />, desc: 'Emphasize architectural design, core mathematics, algorithms, and deep-dive theory.' }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setLearningStyle(item.value)}
                    className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3.5 ${
                      learningStyle === item.value 
                        ? 'bg-accent/10 border-accent/70' 
                        : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0 transition ${
                      learningStyle === item.value ? 'border-accent bg-accent text-white' : 'border-white/20'
                    }`}>
                      {learningStyle === item.value && <Check size={12} />}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-white mb-0.5 flex items-center gap-1.5">
                        {item.icon}
                        {item.value}
                      </span>
                      <span className="text-xs text-white/50 leading-relaxed block font-medium">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3.5 bg-white/5 border border-white/5 text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold rounded-lg transition flex justify-center items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 py-3.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-98 transition flex justify-center items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Review & Submit */}
          {step === 6 && (
            <div className="animate-in fade-in slide-in-from-right duration-250">
              <h2 className="font-heading text-2xl tracking-tight text-white mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Confirm your learning profile
              </h2>
              <p className="text-xs text-white/50 mb-6 font-medium">Verify your onboarding configurations before curating your specialized roadmap.</p>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 mb-8 flex flex-col gap-4 text-xs font-medium leading-relaxed">
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-white/40 font-bold uppercase text-[9px] tracking-wide">Target Skill</span>
                  <span className="text-white font-semibold text-right">{skill}</span>
                </div>
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-white/40 font-bold uppercase text-[9px] tracking-wide">Experience Level</span>
                  <span className="text-white font-semibold text-right">{level}</span>
                </div>
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-white/40 font-bold uppercase text-[9px] tracking-wide">Primary Goal</span>
                  <span className="text-white font-semibold text-right max-w-[280px] truncate">{goal || 'General Mastery'}</span>
                </div>
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <span className="text-white/40 font-bold uppercase text-[9px] tracking-wide">Weekly Time Budget</span>
                  <span className="text-white font-semibold text-right">{studyHours}</span>
                </div>
                <div className="flex justify-between items-start pb-1">
                  <span className="text-white/40 font-bold uppercase text-[9px] tracking-wide">Learning Style</span>
                  <span className="text-white font-semibold text-right max-w-[280px] truncate">{learningStyle}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3.5 bg-white/5 border border-white/5 text-white/80 hover:text-white hover:bg-white/10 text-xs font-bold rounded-lg transition flex justify-center items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-98 transition flex justify-center items-center gap-1.5 shadow-lg"
                >
                  <BookOpen size={14} />
                  <span>Generate Roadmap</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
