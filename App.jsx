import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import GlobalSearchModal from './components/GlobalSearchModal';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CourseRegistration from './pages/CourseRegistration';
import AttendanceView from './pages/AttendanceView';
import ResultsView from './pages/ResultsView';
import TimetableSchedule from './pages/TimetableSchedule';
import NotificationsView from './pages/NotificationsView';
import ProfileView from './pages/ProfileView';
import CoursesManagement from './pages/CoursesManagement';
import StudentsDirectory from './pages/StudentsDirectory';
import AdminAnalytics from './pages/AdminAnalytics';
import AuditLogsView from './pages/AuditLogsView';
import SystemHealthView from './pages/SystemHealthView';

export default function App() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [resetToken, setResetToken] = useState(null);

  // Check URL query parameters for reset token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setResetToken(token);
      setAuthView('reset');
    }
  }, []);

  // Keyboard shortcut Cmd+K or Ctrl+K for global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset tab to dashboard when switching roles
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-campus-bg flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-3 border-campus-primary/30 border-t-campus-primary rounded-full animate-spin mx-auto"></div>
          <div className="font-extrabold text-sm text-campus-text">Initializing CampusFlow Portal...</div>
          <div className="text-xs text-campus-muted">Verifying session & database connection</div>
        </div>
      </div>
    );
  }

  // Unauthenticated Views
  if (!user) {
    if (authView === 'forgot') {
      return <ForgotPassword onBackToLogin={() => setAuthView('login')} />;
    }
    if (authView === 'reset' && resetToken) {
      return (
        <ResetPassword 
          token={resetToken} 
          onBackToLogin={() => {
            window.history.replaceState({}, document.title, window.location.pathname);
            setAuthView('login');
          }} 
        />
      );
    }
    return <Login onForgotPassword={() => setAuthView('forgot')} />;
  }

  // Render appropriate dashboard based on user role
  const renderDashboard = () => {
    switch (user.role) {
      case 'ADMIN': return <AdminDashboard onNavigate={setCurrentTab} />;
      case 'FACULTY': return <FacultyDashboard onNavigate={setCurrentTab} />;
      default: return <StudentDashboard onNavigate={setCurrentTab} />;
    }
  };

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard': return renderDashboard();
      case 'registration':
      case 'registrations': return <CourseRegistration />;
      case 'attendance': return <AttendanceView />;
      case 'results': return <ResultsView />;
      case 'timetable': return <TimetableSchedule />;
      case 'notifications': return <NotificationsView />;
      case 'profile': return <ProfileView />;
      case 'courses': return <CoursesManagement />;
      case 'students': return <StudentsDirectory />;
      case 'analytics': return <AdminAnalytics />;
      case 'audit-logs': return <AuditLogsView />;
      case 'system-health': return <SystemHealthView />;
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-campus-bg flex flex-col selection:bg-campus-secondary selection:text-campus-text">
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={setCurrentTab}
        currentTab={currentTab}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar currentTab={currentTab} onNavigate={setCurrentTab} />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} onNavigate={setCurrentTab} />

      {/* Global Interactive Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setCurrentTab}
      />

      {/* Real-Time Toast Alerts */}
      <Toast />
    </div>
  );
}
