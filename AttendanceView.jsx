import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  CalendarCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Users
} from 'lucide-react';

export default function AttendanceView() {
  const { user } = useAuth();
  const isFaculty = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  // Student State
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Faculty Attendance Marking State
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [roster, setRoster] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hour, setHour] = useState(1);
  const [topic, setTopic] = useState('');
  const [records, setRecords] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [markingSuccess, setMarkingSuccess] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        if (isFaculty) {
          const cRes = await api.getCourses();
          setCourses(cRes.courses || []);
          if (cRes.courses?.length > 0) {
            setSelectedCourse(cRes.courses[0].id);
          }
        } else {
          const res = await api.getMyAttendance();
          setStudentData(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isFaculty]);

  // Load roster when course changes for faculty
  useEffect(() => {
    if (!isFaculty || !selectedCourse) return;
    async function loadRoster() {
      try {
        const res = await api.getCourseRoster(selectedCourse);
        setRoster(res.students || []);
        // Initialize all as PRESENT by default
        const initRecs = {};
        (res.students || []).forEach(s => {
          initRecs[s.student_id] = 'PRESENT';
        });
        setRecords(initRecs);
      } catch (err) {
        console.error(err);
      }
    }
    loadRoster();
  }, [selectedCourse, isFaculty]);

  const toggleStudentStatus = (studentId) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    roster.forEach(s => { updated[s.student_id] = status; });
    setRecords(updated);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedCourse || roster.length === 0) return;

    setSubmitting(true);
    setMarkingSuccess(null);
    try {
      const payload = {
        courseId: Number(selectedCourse),
        date,
        hour: Number(hour),
        topic,
        records: roster.map(s => ({
          studentId: s.student_id,
          status: records[s.student_id] || 'PRESENT'
        }))
      };

      const res = await api.markAttendance(payload);
      setMarkingSuccess(res.message);
      setTopic('');
    } catch (err) {
      alert(err.message || 'Failed to submit attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Academic Attendance System
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            {isFaculty ? 'Course Attendance Management' : 'Subject-Wise Attendance'}
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            {isFaculty
              ? 'Record real-time class attendance and session topics for official university records.'
              : `Overall Cumulative Attendance: ${studentData?.overallPercentage ?? 88.5}% (75% minimum required).`}
          </p>
        </div>
      </div>

      {/* STUDENT VIEW */}
      {!isFaculty && (
        <>
          {/* Low Attendance Warning */}
          {studentData?.subjects?.some(s => s.isLowAttendance) && (
            <div className="p-4 bg-campus-danger/10 border border-campus-danger/30 rounded-3xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-campus-danger flex-shrink-0" />
              <div className="text-xs sm:text-sm text-campus-danger font-medium">
                <strong>Attention Required:</strong> One or more courses have attendance below the mandatory 75% cutoff.
              </div>
            </div>
          )}

          {/* Subject-wise Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(studentData?.subjects || []).map((sub) => (
              <div
                key={sub.courseId}
                className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-extrabold text-campus-primary bg-campus-secondary px-2.5 py-0.5 rounded-full">
                      {sub.courseCode}
                    </span>
                    <span className={`text-xs font-bold ${sub.isLowAttendance ? 'text-campus-danger' : 'text-campus-success'}`}>
                      {sub.percentage}%
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-campus-text line-clamp-1">{sub.courseName}</h4>
                  <div className="text-xs text-campus-muted mt-2 space-y-1">
                    <div>Attended: <span className="font-semibold text-campus-text">{sub.attendedClasses}</span> / {sub.totalClasses} classes</div>
                    <div>Absent: <span className="font-semibold text-campus-danger">{sub.absentClasses}</span></div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-campus-secondary/60">
                  <div className="w-full bg-campus-bg rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${sub.isLowAttendance ? 'bg-campus-danger' : 'bg-campus-success'}`}
                      style={{ width: `${Math.min(100, sub.percentage)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Attendance Session History */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
            <h3 className="font-extrabold text-base text-campus-text mb-1">Recent Lecture History</h3>
            <p className="text-xs text-campus-muted mb-4">Class sessions recorded by department faculty</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-campus-secondary text-campus-muted uppercase text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Period</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Topic Covered</th>
                    <th className="py-2.5 px-3">Faculty</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-campus-secondary/40">
                  {(studentData?.history || []).map((h) => (
                    <tr key={h.id} className="hover:bg-campus-bg/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-campus-text">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="py-3 px-3 font-bold text-campus-primary">Hour {h.hour}</td>
                      <td className="py-3 px-3 font-bold text-campus-text">{h.course_code}</td>
                      <td className="py-3 px-3 text-campus-muted max-w-xs truncate">{h.topic || 'Regular Lecture'}</td>
                      <td className="py-3 px-3 text-campus-muted">{h.faculty_name || 'Prof. Turing'}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          h.status === 'PRESENT' ? 'bg-campus-success/10 text-campus-success' : 'bg-campus-danger/10 text-campus-danger'
                        }`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* FACULTY ATTENDANCE MARKER VIEW */}
      {isFaculty && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary">
          <form onSubmit={handleSubmitAttendance} className="space-y-6">
            {/* Header controls: Course, Date, Hour, Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                  Select Course
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-bold text-campus-text focus:outline-none"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                  Session Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-semibold text-campus-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                  Class Period / Hour
                </label>
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-semibold text-campus-text focus:outline-none"
                >
                  <option value={1}>Period 1 (09:00 - 10:00)</option>
                  <option value={2}>Period 2 (10:15 - 11:15)</option>
                  <option value={3}>Period 3 (11:30 - 12:30)</option>
                  <option value={4}>Period 4 (13:30 - 14:30)</option>
                  <option value={5}>Period 5 (14:45 - 15:45)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                  Lecture Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Consensus & Raft"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs text-campus-text focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Quick Bulk Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-campus-muted">Roster ({roster.length} students):</span>
                <button
                  type="button"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="px-3 py-1 bg-campus-success/10 text-campus-success hover:bg-campus-success/20 rounded-full text-xs font-bold transition-colors"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('ABSENT')}
                  className="px-3 py-1 bg-campus-danger/10 text-campus-danger hover:bg-campus-danger/20 rounded-full text-xs font-bold transition-colors"
                >
                  All Absent
                </button>
              </div>

              {markingSuccess && (
                <div className="text-xs font-bold text-campus-success flex items-center gap-1.5 animate-fadeIn">
                  <CheckCircle className="w-4 h-4" /> {markingSuccess}
                </div>
              )}
            </div>

            {/* Student Roster Table */}
            <div className="overflow-x-auto border border-campus-secondary rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-campus-secondary bg-campus-bg/80 text-campus-muted uppercase text-[10px]">
                    <th className="py-2.5 px-3">Register No</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Section</th>
                    <th className="py-2.5 px-3 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-campus-secondary/40">
                  {roster.map((student) => {
                    const isPresent = records[student.student_id] === 'PRESENT';
                    return (
                      <tr key={student.student_id} className="hover:bg-campus-bg/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-campus-primary">{student.register_number}</td>
                        <td className="py-3 px-3 font-bold text-campus-text">{student.student_name}</td>
                        <td className="py-3 px-3 text-campus-muted">{student.section || 'A'}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => toggleStudentStatus(student.student_id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                              isPresent
                                ? 'bg-campus-success text-white'
                                : 'bg-campus-danger text-white'
                            }`}
                          >
                            {isPresent ? '✓ PRESENT' : '✗ ABSENT'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {roster.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-campus-muted">
                        No enrolled students found for this course.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || roster.length === 0}
                className="px-6 py-3 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-full text-xs font-bold shadow-card transition-all flex items-center gap-2"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Class Attendance
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
