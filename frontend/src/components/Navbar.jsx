import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, LayoutDashboard, User, ChevronLeft, SunMoon, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import MobileMenu from './MobileMenu';

export default function Navbar({ isLanding = false, isDashboard = false }) {
  const { isAuthenticated, logoutUser, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isThemeSubOpen, setIsThemeSubOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const applyTheme = (t) => {
    if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    applyTheme(theme);
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  const renderDropdown = () => {
    const bgClass = isLanding ? 'bg-[#121211] border-white/10' : 'bg-white dark:bg-[#121211] border-neutral-200 dark:border-white/10';
    const textClass = isLanding ? 'text-white/80 hover:text-white hover:bg-white/5' : 'text-neutral-700 dark:text-white/80 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white';
    const iconClass = isLanding ? 'text-white/60' : 'text-neutral-400 dark:text-white/60';
    const borderClass = isLanding ? 'bg-white/5' : 'bg-neutral-200 dark:bg-white/5';
    
    return (
      <div className={`absolute right-0 mt-2 w-48 border rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${bgClass}`}>
        <Link
          to="/profile"
          onClick={() => setIsDropdownOpen(false)}
          className={`flex items-center gap-2.5 px-4 py-2 text-sm transition font-medium ${textClass}`}
        >
          <User size={16} className={iconClass} />
          <span>Profile</span>
        </Link>
        
        <div className={`h-px my-1 ${borderClass}`} />
        
        {/* Theme Menu Item - only show if NOT on landing page */}
        {!isLanding && (
          <>
            <div 
              className="relative group/theme"
              onMouseEnter={() => setIsThemeSubOpen(true)}
              onMouseLeave={() => setIsThemeSubOpen(false)}
            >
              <button
                onClick={() => setIsThemeSubOpen(!isThemeSubOpen)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition font-medium text-left focus:outline-none ${textClass}`}
              >
                <div className="flex items-center gap-2.5">
                  <SunMoon size={16} className={iconClass} />
                  <span>Theme</span>
                </div>
              </button>
              
              {isThemeSubOpen && (
                <div className="absolute right-full top-0 mr-1 w-36 bg-white dark:bg-[#121211] border border-neutral-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-right-2 duration-150">
                  <button
                    onClick={() => {
                      handleThemeChange('light');
                      setIsDropdownOpen(false);
                      setIsThemeSubOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-white/80 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition font-medium text-left"
                  >
                    <Sun size={16} className={theme === 'light' ? 'text-accent' : 'text-neutral-400 dark:text-white/50'} />
                    <span className={theme === 'light' ? 'text-accent font-semibold' : ''}>Light</span>
                  </button>
                  <button
                    onClick={() => {
                      handleThemeChange('dark');
                      setIsDropdownOpen(false);
                      setIsThemeSubOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-white/80 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white transition font-medium text-left"
                  >
                    <Moon size={16} className={theme === 'dark' ? 'text-accent' : 'text-neutral-400 dark:text-white/50'} />
                    <span className={theme === 'dark' ? 'text-accent font-semibold' : ''}>Dark</span>
                  </button>
                </div>
              )}
            </div>
            <div className={`h-px my-1 ${borderClass}`} />
          </>
        )}
        
        <button
          onClick={async () => {
            setIsDropdownOpen(false);
            await handleLogout();
          }}
          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition font-medium text-left"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    );
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setIsThemeSubOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
            : 'bg-white/80 dark:bg-[#0D0D0C]/80 backdrop-blur-md border-b border-neutral-200/60 dark:border-white/5 py-3' 
          : 'bg-transparent py-5 sm:py-6'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 flex justify-between items-center relative">
        {isLanding ? (
          <>
            {/* Left: Wordmark (only on Landing) */}
            <Link 
              to="/" 
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="font-heading text-xl sm:text-2xl tracking-tight select-none focus:outline-none z-10 text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Pathways
            </Link>

            {/* Center: Desktop Nav (Perfectly Centered & Symmetrical) */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
              <a 
                href="#features" 
                className="text-sm font-medium transition-opacity hover:opacity-70 text-white"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-sm font-medium transition-opacity hover:opacity-70 text-white"
              >
                How It Works
              </a>
              <a 
                href="#resources" 
                className="text-sm font-medium transition-opacity hover:opacity-70 text-white"
              >
                Resources
              </a>
              <a 
                href="#library" 
                className="text-sm font-medium transition-opacity hover:opacity-70 text-white"
              >
                Library
              </a>
              <a 
                href="#comparison" 
                className="text-sm font-medium transition-opacity hover:opacity-70 text-white"
              >
                Comparison
              </a>
              <a 
                href="#faq" 
                className="text-sm font-medium transition-opacity hover:opacity-70 text-white"
              >
                FAQ
              </a>
            </div>

            {/* Right: Actions */}
            <div className="hidden md:flex items-center gap-4 z-10">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/dashboard"
                    className="bg-accent text-white text-xs font-semibold px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
                  >
                    <LayoutDashboard size={14} />
                    <span>Dashboard</span>
                  </Link>
                  
                  <div className="relative" ref={dropdownRef}>
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-9 h-9 rounded-full border border-white/5 hover:border-accent bg-white/5 text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition focus:outline-none"
                      title="Profile Options"
                    >
                      <User size={18} />
                    </button>

                    {isDropdownOpen && renderDropdown()}
                  </div>
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
              className="md:hidden p-1.5 focus:outline-none rounded-full z-10 text-white"
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
              isLanding={isLanding}
            />
          </>
        ) : (
          /* Non-landing pages: Render Back to Dashboard or Logo on the left, profile on the right */
          isAuthenticated && (
            <>
              {isDashboard ? (
                /* Empty on Dashboard (reverted to previous empty state) */
                <div className="z-10" />
              ) : (
                /* Back to Dashboard (Left) */
                <Link 
                  to="/dashboard" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 hover:border-accent/40 rounded-lg text-xs font-semibold text-neutral-700 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white transition backdrop-blur-sm shadow-md"
                >
                  <ChevronLeft size={16} className="text-accent" />
                  <span>Back to Dashboard</span>
                </Link>
              )}

              {/* Profile Avatar (Right) */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-9 h-9 rounded-full border border-neutral-200 dark:border-white/5 hover:border-accent bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-white/80 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 flex items-center justify-center transition focus:outline-none"
                  title="Profile Options"
                >
                  <User size={18} />
                </button>

                {isDropdownOpen && renderDropdown()}
              </div>
            </>
          )
        )}
      </div>
    </header>
  );
}
