import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import MobileMenu from './MobileMenu';

export default function Navbar({ isLanding = false }) {
  const { isAuthenticated, logoutUser, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? isLanding 
            ? 'bg-[#0D0D0C]/80 backdrop-blur-md border-b border-white/5 py-3' 
            : 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 py-3'
          : 'bg-transparent py-5 sm:py-6'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 flex justify-between items-center relative">
        {/* Left: Wordmark */}
        <Link 
          to="/" 
          className="font-heading text-xl sm:text-2xl tracking-tight select-none focus:outline-none z-10"
          style={{ fontFamily: 'var(--font-heading)', color: isLanding ? '#FFFFFF' : 'var(--color-text)' }}
        >
          Pathways
        </Link>

        {/* Center: Desktop Nav (Perfectly Centered & Symmetrical) */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link 
                to="/dashboard" 
                className={`text-sm font-medium transition-opacity hover:opacity-70 ${isLanding ? 'text-white' : 'text-text'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/profile" 
                className={`text-sm font-medium transition-opacity hover:opacity-70 ${isLanding ? 'text-white' : 'text-text'}`}
              >
                Profile
              </Link>
            </>
          ) : (
            <>
              <a 
                href="#features" 
                className={`text-sm font-medium transition-opacity hover:opacity-70 ${isLanding ? 'text-white' : 'text-text'}`}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className={`text-sm font-medium transition-opacity hover:opacity-70 ${isLanding ? 'text-white' : 'text-text'}`}
              >
                How It Works
              </a>
              <a 
                href="#resources" 
                className={`text-sm font-medium transition-opacity hover:opacity-70 ${isLanding ? 'text-white' : 'text-text'}`}
              >
                Resources
              </a>
              <a 
                href="#library" 
                className={`text-sm font-medium transition-opacity hover:opacity-70 ${isLanding ? 'text-white' : 'text-text'}`}
              >
                Library
              </a>
              <a 
                href="#comparison" 
                className={`text-sm font-medium transition-opacity hover:opacity-70 ${isLanding ? 'text-white' : 'text-text'}`}
              >
                Comparison
              </a>
              <a 
                href="#faq" 
                className={`text-sm font-medium transition-opacity hover:opacity-70 ${isLanding ? 'text-white' : 'text-text'}`}
              >
                FAQ
              </a>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-4 z-10">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className={`text-xs ${isLanding ? 'text-white/70' : 'text-text/70'}`}>
                Hi, {user?.username}
              </span>
              <Link
                to="/dashboard"
                className="bg-accent text-white text-sm font-semibold px-5 py-2 rounded-lg hover:shadow-lg transition duration-200 active:scale-95 flex items-center gap-1.5"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-semibold px-5 py-2 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition duration-200 active:scale-95 flex items-center gap-1.5"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link 
                to="/login" 
                className="bg-[#F2F2EE] text-[#192837] text-sm font-semibold px-5 py-2 rounded-lg hover:bg-neutral-200 transition duration-200 active:scale-95"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-accent text-white text-sm font-semibold px-5 py-2 rounded-lg hover:shadow-md hover:brightness-110 transition duration-200 active:scale-95"
              >
                Start Learning
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Hamburger Button */}
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-1.5 focus:outline-none rounded-full z-10"
          style={{ color: isLanding ? '#FFFFFF' : 'var(--color-text)' }}
        >
          <Menu size={24} />
        </button>

        {/* Mobile Menu Overlay */}
        <MobileMenu 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
          isAuthenticated={isAuthenticated}
          handleLogout={handleLogout}
          user={user}
        />
      </div>
    </header>
  );
}
