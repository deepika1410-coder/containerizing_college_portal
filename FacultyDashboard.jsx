import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  CalendarCheck,
  Award,
  Users,
  Megaphone,
  Clock,
  MapPin,
  CheckCircle,
  Plus
} from 'lucide-react';

export default function FacultyDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState('EXAM');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getCourses();
        // Courses handled by this faculty or all courses in their dept
        setCourses(res.courses || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      await api.broadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
        category: broadcastCategory,
        priority: 'HIGH'
      });
      setBroadcastSuccess(true);
      setTimeout(() => {
        setBroadcastSuccess(false);
        setShowBroadcastModal(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Top Greeting */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Faculty Portal • {user?.department_name || 'Computer Science & Engineering'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Welcome, {user?.name || 'Professor'}! 🎓
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Designation: <span className="font-semibold text-campus-text">{user?.designation || 'Associate Professor'}</span> • ID: {user?.employee_id || 'FAC-1001'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('attendance')}
            className="px-4 py-2.5 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4" /> Mark Attendance
          </button>
          <button
            onClick={() => onNavigate('results')}
            className="px-4 py-2.5 bg-campus-secondary hover:bg-campus-secondary/80 text-campus-text rounded-full text-xs font-bold transition-all flex items-center gap-2"
          >
            <Award className="w-4 h-4 text-campus-primary" /> Enter Marks
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-4 py-2.5 bg-white border border-campus-secondary hover:bg-campus-secondary/40 text-campus-text rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <Megaphone className="w-4 h-4 text-campus-primary" /> Post Notice
          </button>
        </div>
      </div>

      {/* Faculty KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary">
          <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Assigned Courses</span>
          <div className="text-3xl font-extrabold text-campus-text mt-2">
            {courses.length}
          </div>
          <span className="text-xs text-campus-muted">Odd Semester 2026</span>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary">
          <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Enrolled Students</span>
          <div className="text-3xl font-extrabold text-campus-text mt-2">
            {courses.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)}
          </div>
          <span className="text-xs text-campus-muted">Active course registrants</span>
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary">
          <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Class Average Attendance</span>
          <div className="text-3xl font-extrabold text-campus-success mt-2">
            91.4%
          </div>
          <span className="text-xs text-campus-muted">Above required threshold</span>
        </div>
      </div>

      {/* Courses Handled Table / Cards */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-lg text-campus-text">Assigned Courses & Lecture Workload</h3>
            <p className="text-xs text-campus-muted">Real-time enrollment capacity and syllabus breakdown</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-5 rounded-2xl bg-campus-bg border border-campus-secondary/80 hover:border-campus-primary/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-extrabold text-campus-primary bg-campus-secondary px-2.5 py-0.5 rounded-full">
                    {course.code}
                  </span>
                  <span className="text-xs text-campus-muted font-medium">
                    {course.credits} Credits • Sem {course.semester}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-campus-text line-clamp-1">{course.name}</h4>
                <p className="text-xs text-campus-muted mt-1 line-clamp-2">{course.syllabus || 'ACID transactions, relational normalization, PostgreSQL architecture.'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-campus-secondary/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-campus-text">{course.enrolled_count} / {course.max_seats} Seats</div>
                  <div className="w-24 bg-white rounded-full h-1.5 mt-1 border border-campus-secondary overflow-hidden">
                    <div
                      className="bg-campus-primary h-full rounded-full"
                      style={{ width: `${(course.enrolled_count / course.max_seats) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onNavigate('attendance')}
                    className="p-2 bg-white hover:bg-campus-secondary text-campus-primary rounded-xl border border-campus-secondary shadow-sm transition-all text-xs font-bold"
                    title="Mark Attendance"
                  >
                    <CalendarCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('results')}
                    className="p-2 bg-white hover:bg-campus-secondary text-campus-primary rounded-xl border border-campus-secondary shadow-sm transition-all text-xs font-bold"
                    title="Enter Marks"
                  >
                    <Award className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Broadcast Notice Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-campus-text/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-modal border border-campus-secondary">
            <h3 className="font-extrabold text-lg text-campus-text">Broadcast Class Notice</h3>
            <p className="text-xs text-campus-muted mt-1">Dispatches real-time WebSocket alerts to all enrolled students.</p>

            {broadcastSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-campus-success mx-auto" />
                <h4 className="font-bold text-sm text-campus-text">Notice Broadcasted Successfully!</h4>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Notice Category</label>
                  <select
                    value={broadcastCategory}
                    onChange={(e) => setBroadcastCategory(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-xl text-xs font-semibold text-campus-text"
                  >
                    <option value="EXAM">EXAM</option>
                    <option value="ASSIGNMENT">ASSIGNMENT</option>
                    <option value="ATTENDANCE">ATTENDANCE</option>
                    <option value="COLLEGE">COLLEGE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab Session 4 Report Submission"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-xl text-xs text-campus-text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Message Content</label>
                  <textarea
                    rows={3}
                    placeholder="Provide details and deadline information..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-xl text-xs text-campus-text"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBroadcastModal(false)}
                    className="px-4 py-2 text-xs font-bold text-campus-muted hover:text-campus-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-campus-primary text-white text-xs font-bold rounded-full shadow-card hover:bg-campus-primary-dark"
                  >
                    Broadcast Immediately
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
