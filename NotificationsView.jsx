import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import {
  Bell,
  CheckCheck,
  Trash2,
  Plus,
  Award,
  BookOpen,
  AlertTriangle,
  Megaphone,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function NotificationsView() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refreshNotifications } = useSocket();
  const [filter, setFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('COLLEGE');
  const [priority, setPriority] = useState('NORMAL');
  const [sending, setSending] = useState(false);

  const canBroadcast = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  const categories = ['ALL', 'EXAM', 'REGISTRATION', 'ATTENDANCE', 'RESULT', 'COLLEGE'];

  const filteredNotifs = filter === 'ALL'
    ? notifications
    : notifications.filter(n => n.category === filter);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    setSending(true);
    try {
      await api.broadcastNotification({ title, message, category, priority });
      setShowModal(false);
      setTitle('');
      setMessage('');
      refreshNotifications();
    } catch (err) {
      alert(err.message || 'Failed to dispatch broadcast.');
    } finally {
      setSending(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'EXAM': return <Award className="w-5 h-5 text-campus-warning" />;
      case 'REGISTRATION': return <BookOpen className="w-5 h-5 text-campus-primary" />;
      case 'ATTENDANCE': return <AlertTriangle className="w-5 h-5 text-campus-danger" />;
      case 'RESULT': return <Award className="w-5 h-5 text-campus-success" />;
      default: return <Megaphone className="w-5 h-5 text-campus-primary" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Real-Time Push Alerts
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Announcements & Notifications
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Connected via WebSocket gateway. <span className="font-bold text-campus-text">{unreadCount} unread notices</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-campus-secondary hover:bg-campus-secondary/80 text-campus-text rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-campus-primary" /> Mark All as Read
            </button>
          )}
          {canBroadcast && (
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-full text-xs font-bold shadow-card transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              filter === cat
                ? 'bg-campus-primary text-white shadow-card'
                : 'bg-white text-campus-muted hover:text-campus-text border border-campus-secondary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.map((n) => (
          <div
            key={n.id}
            className={`p-5 rounded-3xl bg-white border transition-all shadow-subtle flex items-start gap-4 ${
              !n.is_read ? 'border-campus-primary/40 bg-campus-bg/40' : 'border-campus-secondary'
            }`}
          >
            <div className="p-3 bg-campus-secondary/60 rounded-2xl flex-shrink-0">
              {getCategoryIcon(n.category)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-campus-primary bg-campus-secondary px-2.5 py-0.5 rounded-full">
                    {n.category}
                  </span>
                  {n.priority === 'URGENT' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-campus-danger/15 text-campus-danger rounded-full">
                      URGENT
                    </span>
                  )}
                  {n.priority === 'HIGH' && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-campus-warning/15 text-campus-warning rounded-full">
                      HIGH
                    </span>
                  )}
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-campus-primary"></span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-campus-muted">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-campus-muted" />
                    {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-campus-primary hover:underline font-bold text-[11px]"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="text-campus-muted hover:text-campus-danger p-1 rounded-full transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="font-extrabold text-sm text-campus-text">{n.title}</h4>
              <p className="text-xs text-campus-muted mt-1 leading-relaxed">{n.message}</p>
              {n.sender_name && (
                <div className="text-[11px] text-campus-muted mt-2 font-medium">
                  Posted by: <span className="font-bold text-campus-text">{n.sender_name}</span> ({n.sender_role})
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredNotifs.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-card border border-campus-secondary">
            <Bell className="w-12 h-12 text-campus-muted mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-base text-campus-text">No Notifications</h4>
            <p className="text-xs text-campus-muted mt-1">There are no active notices under "{filter}".</p>
          </div>
        )}
      </div>

      {/* New Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-campus-text/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-modal border border-campus-secondary">
            <h3 className="font-extrabold text-xl text-campus-text">Broadcast Announcement</h3>
            <p className="text-xs text-campus-muted mt-1">
              Dispatches real-time WebSocket alerts and saves notifications in the persistent PostgreSQL ledger.
            </p>

            <form onSubmit={handleBroadcast} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-bold text-campus-text"
                  >
                    <option value="EXAM">EXAM</option>
                    <option value="REGISTRATION">REGISTRATION</option>
                    <option value="ATTENDANCE">ATTENDANCE</option>
                    <option value="RESULT">RESULT</option>
                    <option value="COLLEGE">COLLEGE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-bold text-campus-text"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Notice Title</label>
                <input
                  type="text"
                  placeholder="e.g. End Semester Schedule Release"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs text-campus-text focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Notice Body</label>
                <textarea
                  rows={4}
                  placeholder="Write clear instructions for students and faculty..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs text-campus-text focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-campus-muted hover:text-campus-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-2.5 bg-campus-primary text-white text-xs font-bold rounded-full shadow-card hover:bg-campus-primary-dark"
                >
                  {sending ? 'Dispatching...' : 'Broadcast to Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
