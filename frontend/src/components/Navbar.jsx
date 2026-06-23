import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import MobileMenu from './MobileMenu';

export default function Navbar({ isLanding = false }) {
  const { isAuthenticated, logoutUser, user } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/');
  };

  return (
    <nav className="relative z-30 w-full max-w-7xl mx-auto px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center">
      {/* Left: Wordmark */}
      <Link 
        to="/" 
        className="font-heading text-xl sm:text-2xl tracking-tight select-none focus:outline-none"
        style={{ fontFamily: 'var(--font-heading)', color: isLanding ? '#FFFFFF' : 'var(--color-text)' }}
      >
        Pathways<span className="text-accent">.</span>
      </Link>

      {/* Center: Desktop Nav */}
      <div className="hidden md:flex items-center gap-8">
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
              href="#how-it-works" 
              className={`text-sm font-medium transition-opacity hover:opacity-70 ${isLanding ? 'text-white' : 'text-text'}`}
            >
              How It Works
            </a>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div className="hidden md:flex items-center gap-4">
        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <span className={`text-xs ${isLanding ? 'text-white/70' : 'text-text/70'}`}>
              Hi, {user?.username}
            </span>
            <Link
              to="/dashboard"
              className="bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:shadow-lg transition duration-200 active:scale-95 flex items-center gap-1.5"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-700 transition duration-200 active:scale-95 flex items-center gap-1.5"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <Link 
              to="/login" 
              className="bg-[#F2F2EE] text-[#192837] text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-neutral-200 transition duration-200 active:scale-95"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:shadow-md hover:brightness-110 transition duration-200 active:scale-95"
            >
              Start Learning
            </Link>
          </>
        )}
      </div>

      {/* Mobile: Hamburger Button */}
      <button 
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden p-1.5 focus:outline-none rounded-full"
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
    </nav>
  );
}
