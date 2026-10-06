import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Search, Bell, LogOut, User, Shield, GraduationCap, Briefcase, ChevronDown } from 'lucide-react';

export default function Navbar({ onOpenSearch, onNavigate, currentTab }) {
  const { user, logout, loginWithDemo } = useAuth();
  const { unreadCount } = useSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleDemoSwitch = async (role) => {
    if (user?.role === role) return;
    setSwitching(true);
    try {
      await loginWithDemo(role);
      onNavigate('dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSwitching(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-campus-text text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>;
      case 'FACULTY':
        return <span className="bg-campus-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Briefcase className="w-3 h-3" /> Faculty</span>;
      default:
        return <span className="bg-campus-secondary text-campus-primary text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Student</span>;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-campus-secondary px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-campus-primary flex items-center justify-center text-white shadow-card">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-campus-text">Campus<span className="text-campus-primary">Flow</span></span>
            <div className="text-[10px] uppercase font-bold tracking-widest text-campus-muted -mt-1 hidden sm:block">Smart Portal</div>
          </div>
        </div>

        {/* Global Search Bar (Trigger) */}
        <div 
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-3 px-4 py-2 bg-campus-bg hover:bg-campus-secondary/40 border border-campus-secondary rounded-full w-80 cursor-pointer transition-colors shadow-subtle"
        >
          <Search className="w-4 h-4 text-campus-muted" />
          <span className="text-xs text-campus-muted font-medium flex-1">Search courses, students, alerts...</span>
          <kbd className="text-[10px] bg-white text-campus-muted px-2 py-0.5 rounded-md border border-campus-secondary font-mono shadow-sm">⌘K</kbd>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher Pills */}
          <div className="hidden lg:flex items-center bg-campus-bg p-1 rounded-full border border-campus-secondary text-xs font-semibold">
            <span className="text-campus-muted px-2 text-[11px] uppercase tracking-wider">Demo:</span>
            <button
              onClick={() => handleDemoSwitch('STUDENT')}
              disabled={switching}
              className={`px-3 py-1 rounded-full transition-all ${user?.role === 'STUDENT' ? 'bg-campus-primary text-white shadow-sm' : 'text-campus-text hover:text-campus-primary'}`}
            >
              Student
            </button>
            <button
              onClick={() => handleDemoSwitch('FACULTY')}
              disabled={switching}
              className={`px-3 py-1 rounded-full transition-all ${user?.role === 'FACULTY' ? 'bg-campus-primary text-white shadow-sm' : 'text-campus-text hover:text-campus-primary'}`}
            >
              Faculty
            </button>
            <button
              onClick={() => handleDemoSwitch('ADMIN')}
              disabled={switching}
              className={`px-3 py-1 rounded-full transition-all ${user?.role === 'ADMIN' ? 'bg-campus-primary text-white shadow-sm' : 'text-campus-text hover:text-campus-primary'}`}
            >
              Admin
            </button>
          </div>

          {/* Search button for mobile */}
          <button 
            onClick={onOpenSearch}
            className="md:hidden p-2 rounded-full hover:bg-campus-bg text-campus-text transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => onNavigate('notifications')}
            className="relative p-2.5 rounded-full hover:bg-campus-secondary/40 text-campus-text transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-campus-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 p-1 pl-2 rounded-full hover:bg-campus-bg border border-transparent hover:border-campus-secondary transition-all"
            >
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-campus-text truncate max-w-[120px]">{user?.name}</div>
                <div className="flex justify-end">{getRoleBadge(user?.role)}</div>
              </div>
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt=""
                className="w-9 h-9 rounded-full object-cover border-2 border-campus-secondary shadow-sm"
              />
              <ChevronDown className="w-3.5 h-3.5 text-campus-muted hidden sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-modal border border-campus-secondary py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-campus-secondary/50 sm:hidden">
                  <div className="text-sm font-bold text-campus-text">{user?.name}</div>
                  <div className="text-xs text-campus-muted truncate">{user?.email}</div>
                  <div className="mt-1.5">{getRoleBadge(user?.role)}</div>
                </div>

                <button
                  onClick={() => { onNavigate('profile'); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-campus-text hover:bg-campus-bg flex items-center gap-2.5 font-medium transition-colors"
                >
                  <User className="w-4 h-4 text-campus-muted" /> My Profile
                </button>

                <div className="lg:hidden border-t border-campus-secondary/50 my-1 pt-1">
                  <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-campus-muted">Switch Role:</div>
                  <button onClick={() => { handleDemoSwitch('STUDENT'); setMenuOpen(false); }} className="w-full px-4 py-1.5 text-left text-xs hover:bg-campus-bg text-campus-text font-medium">Student Demo</button>
                  <button onClick={() => { handleDemoSwitch('FACULTY'); setMenuOpen(false); }} className="w-full px-4 py-1.5 text-left text-xs hover:bg-campus-bg text-campus-text font-medium">Faculty Demo</button>
                  <button onClick={() => { handleDemoSwitch('ADMIN'); setMenuOpen(false); }} className="w-full px-4 py-1.5 text-left text-xs hover:bg-campus-bg text-campus-text font-medium">Admin Demo</button>
                </div>

                <div className="border-t border-campus-secondary/50 my-1"></div>

                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-campus-danger hover:bg-campus-danger/10 flex items-center gap-2.5 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
