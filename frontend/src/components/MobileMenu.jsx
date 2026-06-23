import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, LayoutDashboard, User, Zap, Compass, HelpCircle, Library, ArrowLeftRight, BookOpen } from 'lucide-react';

export default function MobileMenu({ isOpen, onClose, isAuthenticated, handleLogout, user }) {
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const sheetVariants = {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
    },
    exit: { 
      x: '100%',
      transition: { duration: 0.35, ease: [0.55, 0, 1, 0.45] }
    }
  };

  const linkVariants = (index) => ({
    hidden: { opacity: 0, x: 20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { delay: 0.18 + index * 0.07, duration: 0.3, ease: 'easeOut' }
    }
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[rgba(25,40,55,0.35)] backdrop-blur-[4px]"
          />

          {/* Right-side Slide-in Sheet */}
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 z-50 w-full max-w-[360px] h-[100dvh] bg-[#CFC8C5] text-[#192837] px-6 py-5 flex flex-col justify-between"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <span className="font-heading text-lg tracking-tight select-none">
                Pathways
              </span>
              <button 
                onClick={onClose}
                className="p-1.5 hover:bg-black/5 rounded-full transition"
              >
                <X size={22} />
              </button>
            </div>

            {/* Links List */}
            <div className="flex flex-col gap-6 my-auto">
              {isAuthenticated ? (
                <>
                  <motion.div variants={linkVariants(0)} initial="hidden" animate="visible">
                    <Link 
                      to="/dashboard" 
                      onClick={onClose}
                      className="flex items-center gap-3 text-xl font-semibold hover:opacity-75 transition-opacity"
                    >
                      <LayoutDashboard size={20} />
                      Dashboard
                    </Link>
                  </motion.div>
                  
                  <motion.div variants={linkVariants(1)} initial="hidden" animate="visible">
                    <Link 
                      to="/profile" 
                      onClick={onClose}
                      className="flex items-center gap-3 text-xl font-semibold hover:opacity-75 transition-opacity"
                    >
                      <User size={20} />
                      Profile
                    </Link>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div variants={linkVariants(0)} initial="hidden" animate="visible">
                    <a 
                      href="#features" 
                      onClick={onClose}
                      className="flex items-center gap-3 text-xl font-semibold hover:opacity-75 transition-opacity"
                    >
                      <Zap size={20} className="text-accent" />
                      Features
                    </a>
                  </motion.div>
                  <motion.div variants={linkVariants(1)} initial="hidden" animate="visible">
                    <a 
                      href="#library" 
                      onClick={onClose}
                      className="flex items-center gap-3 text-xl font-semibold hover:opacity-75 transition-opacity"
                    >
                      <Library size={20} className="text-accent" />
                      Library
                    </a>
                  </motion.div>
                  <motion.div variants={linkVariants(2)} initial="hidden" animate="visible">
                    <a 
                      href="#comparison" 
                      onClick={onClose}
                      className="flex items-center gap-3 text-xl font-semibold hover:opacity-75 transition-opacity"
                    >
                      <ArrowLeftRight size={20} className="text-accent" />
                      Comparison
                    </a>
                  </motion.div>
                  <motion.div variants={linkVariants(3)} initial="hidden" animate="visible">
                    <a 
                      href="#resources" 
                      onClick={onClose}
                      className="flex items-center gap-3 text-xl font-semibold hover:opacity-75 transition-opacity"
                    >
                      <BookOpen size={20} className="text-accent" />
                      Resources
                    </a>
                  </motion.div>
                  <motion.div variants={linkVariants(4)} initial="hidden" animate="visible">
                    <a 
                      href="#how-it-works" 
                      onClick={onClose}
                      className="flex items-center gap-3 text-xl font-semibold hover:opacity-75 transition-opacity"
                    >
                      <Compass size={20} className="text-accent" />
                      How It Works
                    </a>
                  </motion.div>
                  <motion.div variants={linkVariants(5)} initial="hidden" animate="visible">
                    <a 
                      href="#faq" 
                      onClick={onClose}
                      className="flex items-center gap-3 text-xl font-semibold hover:opacity-75 transition-opacity"
                    >
                      <HelpCircle size={20} className="text-accent" />
                      FAQ
                    </a>
                  </motion.div>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <div className="text-center text-xs opacity-75 mb-1">
                    Logged in as <span className="font-semibold">{user?.username}</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      handleLogout();
                    }}
                    className="w-full py-3.5 bg-neutral-800 text-white text-sm font-semibold rounded-lg hover:bg-neutral-900 transition flex justify-center items-center gap-2"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="w-full py-3.5 bg-[#F2F2EE] text-center text-[#192837] text-sm font-semibold rounded-lg hover:bg-neutral-200 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={onClose}
                    className="w-full py-3.5 bg-accent text-center text-white text-sm font-semibold rounded-lg hover:shadow-md transition"
                  >
                    Start Learning
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
