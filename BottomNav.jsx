import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  Award,
  Bell,
  User,
  Users,
  Megaphone,
  BarChart3
} from 'lucide-react';

export default function BottomNav({ currentTab, onNavigate }) {
  const { user } = useAuth();
  const { unreadCount } = useSocket();

  const getMobileItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'courses', label: 'Courses', icon: BookOpen },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'notifications', label: 'Broadcast', icon: Megaphone, badge: unreadCount },
          { id: 'profile', label: 'Profile', icon: User }
        ];
      case 'FACULTY':
        return [
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { id: 'results', label: 'Marks', icon: Award },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'notifications', label: 'Alerts', icon: Megaphone, badge: unreadCount }
        ];
      default: // STUDENT
        return [
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'registration', label: 'Enroll', icon: BookOpen },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { id: 'results', label: 'Results', icon: Award },
          { id: 'notifications', label: 'Alerts', icon: Bell, badge: unreadCount }
        ];
    }
  };

  const mobileItems = getMobileItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-campus-secondary px-3 py-2 shadow-modal safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl relative transition-all ${
                isActive ? 'text-campus-primary' : 'text-campus-muted hover:text-campus-text'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-campus-secondary text-campus-primary' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'font-bold text-campus-primary' : ''}`}>
                {item.label}
              </span>
              {item.badge > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-campus-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
