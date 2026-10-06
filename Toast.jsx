import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, X, AlertTriangle, Award, BookOpen, Megaphone } from 'lucide-react';

export default function Toast() {
  const { latestToast, clearToast } = useSocket();

  if (!latestToast) return null;

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'EXAM': return <Award className="w-5 h-5 text-campus-warning" />;
      case 'REGISTRATION': return <BookOpen className="w-5 h-5 text-campus-primary" />;
      case 'ATTENDANCE': return <AlertTriangle className="w-5 h-5 text-campus-danger" />;
      case 'RESULT': return <Award className="w-5 h-5 text-campus-success" />;
      default: return <Megaphone className="w-5 h-5 text-campus-primary" />;
    }
  };

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white rounded-2xl shadow-modal border border-campus-secondary p-4 animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-campus-secondary rounded-xl flex-shrink-0">
          {getCategoryIcon(latestToast.category)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-2 py-0.5 rounded-full">
              {latestToast.category}
            </span>
            <button 
              onClick={clearToast}
              className="text-campus-muted hover:text-campus-text transition-colors p-0.5 rounded-full hover:bg-campus-bg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-sm font-semibold text-campus-text mt-1 truncate">
            {latestToast.title}
          </h4>
          <p className="text-xs text-campus-muted mt-1 line-clamp-2 leading-relaxed">
            {latestToast.message}
          </p>
        </div>
      </div>
    </div>
  );
}
