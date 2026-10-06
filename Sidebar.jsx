import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  Award,
  Calendar,
  Bell,
  User,
  Users,
  Megaphone,
  BarChart3,
  ShieldCheck,
  Activity,
  FileText
} from 'lucide-react';

export default function Sidebar({ currentTab, onNavigate }) {
  const { user } = useAuth();
  const { unreadCount } = useSocket();

  const getNavItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'courses', label: 'Course Management', icon: BookOpen },
          { id: 'registrations', label: 'Registrations', icon: FileText },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { id: 'results', label: 'Results & Publishing', icon: Award },
          { id: 'notifications', label: 'Broadcasts & Alerts', icon: Megaphone, badge: unreadCount },
          { id: 'analytics', label: 'Campus Analytics', icon: BarChart3 },
          { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
          { id: 'system-health', label: 'System Health', icon: Activity },
          { id: 'profile', label: 'My Profile', icon: User }
        ];
      case 'FACULTY':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'attendance', label: 'Mark Attendance', icon: CalendarCheck },
          { id: 'results', label: 'Enter Marks', icon: Award },
          { id: 'students', label: 'Student Roster', icon: Users },
          { id: 'timetable', label: 'Weekly Timetable', icon: Calendar },
          { id: 'notifications', label: 'Announcements', icon: Megaphone, badge: unreadCount },
          { id: 'profile', label: 'My Profile', icon: User }
        ];
      default: // STUDENT
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'registration', label: 'Course Registration', icon: BookOpen },
          { id: 'attendance', label: 'My Attendance', icon: CalendarCheck },
          { id: 'results', label: 'Exam Results', icon: Award },
          { id: 'timetable', label: 'Class Timetable', icon: Calendar },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
          { id: 'profile', label: 'Student Profile', icon: User }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-campus-secondary p-4 flex-shrink-0 select-none min-h-[calc(100vh-65px)]">
      {/* User Context Card */}
      <div className="bg-campus-bg border border-campus-secondary/80 rounded-2xl p-3.5 mb-5 flex items-center gap-3">
        <img
          src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
          alt=""
          className="w-11 h-11 rounded-full object-cover border-2 border-campus-secondary shadow-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-campus-text truncate">{user?.name}</div>
          <div className="text-xs text-campus-muted truncate">
            {user?.role === 'STUDENT' ? `${user?.register_number || '2024CS101'} • Sem ${user?.semester || 5}` : user?.department_name || 'Academic Dept'}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-campus-primary text-white shadow-card'
                  : 'text-campus-text hover:bg-campus-secondary/40 hover:text-campus-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-campus-muted'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-campus-primary' : 'bg-campus-danger text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Portal Version & Status Footer */}
      <div className="pt-4 border-t border-campus-secondary/60">
        <div className="flex items-center justify-between text-xs text-campus-muted">
          <span>Cluster: <span className="font-semibold text-campus-text">k8s-prod</span></span>
          <span className="flex items-center gap-1.5 text-campus-success font-semibold">
            <span className="w-2 h-2 rounded-full bg-campus-success animate-pulse"></span>
            Operational
          </span>
        </div>
      </div>
    </aside>
  );
}
