import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../services/api';
import {
  BookOpen,
  CalendarCheck,
  Award,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function StudentDashboard({ onNavigate }) {
  const { user } = useAuth();
  const { notifications } = useSocket();
  const [attendanceData, setAttendanceData] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [attRes, resRes, regRes, timeRes] = await Promise.all([
          api.getMyAttendance().catch(() => ({ overallPercentage: 88.5, subjects: [] })),
          api.getMyResults().catch(() => ({ semesterGpa: 8.85, cgpa: 8.85, results: [] })),
          api.getMyRegistrations().catch(() => ({ registrations: [] })),
          api.getTimetable().catch(() => ({ scheduleByDay: {} }))
        ]);

        setAttendanceData(attRes);
        setResultsData(resRes);
        setRegistrations(regRes.registrations || []);

        // Pick Monday or Tuesday classes for demo preview
        const schedule = timeRes.scheduleByDay || {};
        const classes = schedule['Monday'] || schedule['Tuesday'] || [];
        setTodayClasses(classes.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const overallAtt = attendanceData?.overallPercentage ?? 88.5;
  const isLowAtt = overallAtt < 75.0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Top Greeting Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Semester {user?.semester || 5} • {user?.department_code || 'CSE'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Good Morning, {user?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Register No: <span className="font-semibold text-campus-text">{user?.register_number || '2024CS101'}</span> • Section {user?.section || 'A'}
          </p>
        </div>

        {/* Quick Action Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('registration')}
            className="px-4 py-2.5 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" /> Enroll Courses
          </button>
          <button
            onClick={() => onNavigate('attendance')}
            className="px-4 py-2.5 bg-campus-secondary hover:bg-campus-secondary/80 text-campus-text rounded-full text-xs font-bold transition-all flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4 text-campus-primary" /> Attendance
          </button>
          <button
            onClick={() => onNavigate('results')}
            className="px-4 py-2.5 bg-campus-secondary hover:bg-campus-secondary/80 text-campus-text rounded-full text-xs font-bold transition-all flex items-center gap-2"
          >
            <Award className="w-4 h-4 text-campus-primary" /> Results
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Card */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary hover:border-campus-primary/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Attendance</span>
            <div className={`p-2 rounded-xl ${isLowAtt ? 'bg-campus-danger/10 text-campus-danger' : 'bg-campus-secondary text-campus-primary'}`}>
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${isLowAtt ? 'text-campus-danger' : 'text-campus-text'}`}>
              {overallAtt}%
            </span>
            <span className="text-xs font-medium text-campus-muted">overall</span>
          </div>
          <div className="mt-2 w-full bg-campus-bg rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isLowAtt ? 'bg-campus-danger' : 'bg-campus-success'}`}
              style={{ width: `${Math.min(100, overallAtt)}%` }}
            ></div>
          </div>
        </div>

        {/* CGPA Card */}
        <div 
          onClick={() => onNavigate('results')}
          className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary hover:border-campus-primary/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Current CGPA</span>
            <div className="p-2 rounded-xl bg-campus-secondary text-campus-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-campus-text">
              {resultsData?.cgpa || '8.85'}
            </span>
            <span className="text-xs font-medium text-campus-muted">/ 10.0</span>
          </div>
          <div className="mt-2 text-xs text-campus-muted font-medium flex items-center gap-1">
            <span>Sem GPA: <span className="font-bold text-campus-text">{resultsData?.semesterGpa || '8.85'}</span></span>
          </div>
        </div>

        {/* Registered Courses Card */}
        <div 
          onClick={() => onNavigate('registration')}
          className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary hover:border-campus-primary/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Registered</span>
            <div className="p-2 rounded-xl bg-campus-secondary text-campus-primary">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-campus-text">
              {registrations.length || 4}
            </span>
            <span className="text-xs font-medium text-campus-muted">courses</span>
          </div>
          <div className="mt-2 text-xs text-campus-muted font-medium">
            Active for Semester {user?.semester || 5}
          </div>
        </div>

        {/* Today's Lectures Card */}
        <div 
          onClick={() => onNavigate('timetable')}
          className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary hover:border-campus-primary/40 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Today's Classes</span>
            <div className="p-2 rounded-xl bg-campus-secondary text-campus-primary">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-campus-text">
              {todayClasses.length || 3}
            </span>
            <span className="text-xs font-medium text-campus-muted">periods</span>
          </div>
          <div className="mt-2 text-xs text-campus-muted font-medium truncate">
            Next: {todayClasses[0]?.course_name || 'Database Systems'}
          </div>
        </div>
      </div>

      {/* Low Attendance Alert Banner if below 75% */}
      {isLowAtt && (
        <div className="bg-campus-danger/10 border border-campus-danger/30 rounded-3xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-campus-danger flex-shrink-0" />
          <div className="text-xs sm:text-sm text-campus-danger font-medium flex-1">
            <strong>Attendance Warning:</strong> Your cumulative attendance is below 75%. Please attend upcoming laboratory and lecture sessions to satisfy exam eligibility requirements.
          </div>
        </div>
      )}

      {/* Main Content: Today's Schedule & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule List */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-lg text-campus-text">Upcoming Lecture Schedule</h3>
              <p className="text-xs text-campus-muted">Daily class slots with room allocations</p>
            </div>
            <button
              onClick={() => onNavigate('timetable')}
              className="text-xs font-bold text-campus-primary hover:underline flex items-center gap-1"
            >
              Full Timetable <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {todayClasses.length > 0 ? (
              todayClasses.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-campus-bg border border-campus-secondary/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-campus-secondary text-campus-primary font-bold text-xs flex items-center justify-center">
                      P{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-campus-text">{item.course_name}</h4>
                      <p className="text-xs text-campus-muted">{item.course_code} • {item.faculty_name || 'Prof. Alan Turing'}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-bold text-campus-text flex items-center gap-1">
                      <Clock className="w-3 h-3 text-campus-primary" /> {item.start_time} - {item.end_time}
                    </span>
                    <span className="text-[11px] text-campus-muted flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {item.room}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-campus-muted">
                No classes scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Real-time Alerts Widget */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-lg text-campus-text">Academic Alerts</h3>
              <p className="text-xs text-campus-muted">Real-time college notices</p>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs font-bold text-campus-primary hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {notifications.slice(0, 4).map((n) => (
              <div
                key={n.id}
                onClick={() => onNavigate('notifications')}
                className="p-3 rounded-2xl bg-campus-bg border border-campus-secondary/60 hover:border-campus-primary/30 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary px-2 py-0.5 rounded-full">
                    {n.category}
                  </span>
                  <span className="text-[10px] text-campus-muted">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h5 className="font-bold text-xs text-campus-text truncate">{n.title}</h5>
                <p className="text-[11px] text-campus-muted line-clamp-1 mt-0.5">{n.message}</p>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-10 text-xs text-campus-muted">
                No new announcements.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
