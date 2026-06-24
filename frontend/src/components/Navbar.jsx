import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, User, ChevronLeft, Route } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import MobileMenu from './MobileMenu';

export default function Navbar({ isLanding = false, isDashboard = false }) {
  const { isAuthenticated, logoutUser, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

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
          ? 'bg-[#0D0D0C]/80 backdrop-blur-md border-b border-white/5 py-3' 
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

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-[#121211] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition font-medium"
                        >
                          <User size={16} className="text-white/60" />
                          <span>Profile</span>
                        </Link>
                        <div className="h-px bg-white/5 my-1" />
                        <button
                          onClick={async () => {
                            setIsDropdownOpen(false);
                            await handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-950/20 hover:text-red-400 transition font-medium text-left"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
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
                /* Branding Logo (Left) */
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-2.5 group focus:outline-none z-10"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/25 flex items-center justify-center text-accent group-hover:scale-105 group-hover:border-accent/50 transition">
                    <Route size={16} className="text-accent" />
                  </div>
                  <span 
                    className="font-heading text-lg sm:text-xl tracking-tight text-white group-hover:text-accent transition-colors"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Pathways
                  </span>
                </Link>
              ) : (
                /* Back to Dashboard (Left) */
                <Link 
                  to="/dashboard" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 hover:border-accent/40 rounded-lg text-xs font-semibold text-white/80 hover:text-white transition backdrop-blur-sm shadow-md"
                >
                  <ChevronLeft size={16} className="text-accent" />
                  <span>Back to Dashboard</span>
                </Link>
              )}

              {/* Profile Avatar (Right) */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-9 h-9 rounded-full border border-white/5 hover:border-accent bg-white/5 text-white/80 hover:text-white hover:bg-white/10 flex items-center justify-center transition focus:outline-none"
                  title="Profile Options"
                >
                  <User size={18} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#121211] border border-white/10 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white transition font-medium"
                    >
                      <User size={16} className="text-white/60" />
                      <span>Profile</span>
                    </Link>
                    <div className="h-px bg-white/5 my-1" />
                    <button
                      onClick={async () => {
                        setIsDropdownOpen(false);
                        await handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-950/20 hover:text-red-400 transition font-medium text-left"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )
        )}
      </div>
    </header>
  );
}
