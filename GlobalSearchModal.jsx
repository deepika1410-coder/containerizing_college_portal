import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, Users, User, Bell } from 'lucide-react';
import { api } from '../services/api';

export default function GlobalSearchModal({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setCourses([]);
      setStudents([]);
      setNotifications([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [cRes, sRes, nRes] = await Promise.all([
          api.getCourses({ search: query }).catch(() => ({ courses: [] })),
          api.getAllStudents({ search: query }).catch(() => ({ students: [] })),
          api.getMyNotifications().catch(() => ({ notifications: [] }))
        ]);

        setCourses((cRes.courses || []).slice(0, 5));
        setStudents((sRes.students || []).slice(0, 5));
        const filteredNotifs = (nRes.notifications || []).filter(n => 
          n.title.toLowerCase().includes(query.toLowerCase()) || 
          n.message.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        setNotifications(filteredNotifs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-campus-text/30 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-modal border border-campus-secondary overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-campus-secondary flex items-center gap-3">
          <Search className="w-5 h-5 text-campus-muted" />
          <input
            type="text"
            placeholder="Search courses, students, faculty, notices..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-campus-text placeholder-campus-muted focus:outline-none text-base"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-campus-muted hover:text-campus-text">
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-xs font-semibold px-2.5 py-1 bg-campus-secondary text-campus-text rounded-full hover:bg-campus-secondary/80"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="py-8 text-center text-sm text-campus-muted">
              Searching CampusFlow directory...
            </div>
          )}

          {!loading && !query && (
            <div className="py-6 text-center text-sm text-campus-muted">
              Type a keyword like <span className="font-semibold text-campus-primary">"Database"</span>, <span className="font-semibold text-campus-primary">"Alex"</span>, or <span className="font-semibold text-campus-primary">"Exam"</span>
            </div>
          )}

          {!loading && query && courses.length === 0 && students.length === 0 && notifications.length === 0 && (
            <div className="py-8 text-center text-sm text-campus-muted">
              No results found for "{query}".
            </div>
          )}

          {courses.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-campus-muted mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Courses
              </h5>
              <div className="space-y-1.5">
                {courses.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { onNavigate('registration'); onClose(); }}
                    className="p-2.5 hover:bg-campus-bg rounded-2xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-sm text-campus-text">{c.name}</div>
                      <div className="text-xs text-campus-muted">{c.code} • Sem {c.semester} • {c.faculty_name || 'Prof. Turing'}</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-campus-secondary text-campus-primary rounded-full font-medium">
                      {c.enrolled_count}/{c.max_seats} Seats
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {students.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-campus-muted mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Students
              </h5>
              <div className="space-y-1.5">
                {students.map(s => (
                  <div
                    key={s.id}
                    className="p-2.5 hover:bg-campus-bg rounded-2xl cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img src={s.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="font-medium text-sm text-campus-text">{s.name}</div>
                        <div className="text-xs text-campus-muted">{s.register_number} • {s.department_code} • Year {s.year}</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-campus-text bg-campus-secondary/60 px-2 py-0.5 rounded-full">
                      CGPA {s.cgpa}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notifications.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-campus-muted mb-2 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Announcements
              </h5>
              <div className="space-y-1.5">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { onNavigate('notifications'); onClose(); }}
                    className="p-2.5 hover:bg-campus-bg rounded-2xl cursor-pointer transition-colors"
                  >
                    <div className="font-medium text-sm text-campus-text truncate">{n.title}</div>
                    <div className="text-xs text-campus-muted truncate">{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
