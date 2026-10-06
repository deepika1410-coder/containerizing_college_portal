import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';

export default function CourseRegistration() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('5');
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const [droppingId, setDroppingId] = useState(null);
  const [successModal, setSuccessModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadData = async () => {
    try {
      const [cRes, rRes] = await Promise.all([
        api.getCourses({ department, semester, search }),
        api.getMyRegistrations()
      ]);
      setCourses(cRes.courses || []);
      setRegistrations(rRes.registrations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [department, semester, search]);

  const registeredCourseIds = new Set(registrations.map(r => r.course_id));

  const handleRegister = async (course) => {
    setRegisteringId(course.id);
    setErrorMessage(null);
    try {
      const res = await api.registerCourse(course.id, Number(semester));
      setSuccessModal({
        courseCode: course.code,
        courseName: course.name,
        remainingSeats: res.remainingSeats
      });
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Course might have reached full capacity.');
    } finally {
      setRegisteringId(null);
    }
  };

  const handleDrop = async (reg) => {
    if (!window.confirm(`Are you sure you want to drop ${reg.course_code}?`)) return;
    setDroppingId(reg.id);
    setErrorMessage(null);
    try {
      await api.dropCourse(reg.course_id, reg.semester);
      await loadData();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to drop course.');
    } finally {
      setDroppingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Course Enrollment System
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Course Registration & Quotas
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Real-time seat counters enforced by PostgreSQL atomic row locks. Total Enrolled: <span className="font-bold text-campus-text">{registrations.length} subjects</span>.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="p-4 bg-campus-danger/10 border border-campus-danger/30 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm text-campus-danger font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-campus-danger hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Enrolled Courses Table */}
      {registrations.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
          <h3 className="font-extrabold text-base text-campus-text mb-1">My Current Enrolled Courses</h3>
          <p className="text-xs text-campus-muted mb-4">You are actively registered in these courses for Semester {semester}.</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-campus-secondary text-campus-muted uppercase text-[10px]">
                  <th className="py-2.5 px-3">Course Code</th>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3">Credits</th>
                  <th className="py-2.5 px-3">Faculty</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-secondary/40">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-campus-bg/60 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-campus-primary">{reg.course_code}</td>
                    <td className="py-3 px-3 font-bold text-campus-text">{reg.course_name}</td>
                    <td className="py-3 px-3">{reg.credits} Cr</td>
                    <td className="py-3 px-3 text-campus-muted">{reg.faculty_name || 'Prof. Alan Turing'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-campus-success/10 text-campus-success">
                        REGISTERED
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDrop(reg)}
                        disabled={droppingId === reg.id}
                        className="p-1.5 rounded-xl hover:bg-campus-danger/10 text-campus-danger transition-colors text-xs font-semibold inline-flex items-center gap-1"
                        title="Drop course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Drop</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Available Courses Catalog with Filter Bar */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-extrabold text-base text-campus-text">Available Department Electives & Core Courses</h3>
            <p className="text-xs text-campus-muted">Select courses to register. Seat counters update in real-time.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-campus-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-campus-bg border border-campus-secondary rounded-full text-xs text-campus-text focus:outline-none focus:border-campus-primary"
              />
            </div>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="px-3 py-1.5 bg-campus-bg border border-campus-secondary rounded-full text-xs font-semibold text-campus-text focus:outline-none"
            >
              <option value="">All Depts</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="AIDS">AIDS</option>
              <option value="MECH">MECH</option>
            </select>

            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="px-3 py-1.5 bg-campus-bg border border-campus-secondary rounded-full text-xs font-semibold text-campus-text focus:outline-none"
            >
              <option value="3">Sem 3</option>
              <option value="5">Sem 5</option>
              <option value="7">Sem 7</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const isRegistered = registeredCourseIds.has(course.id);
            const seatsRemaining = course.max_seats - course.enrolled_count;
            const isFull = seatsRemaining <= 0;
            const isCritical = seatsRemaining === 1;

            return (
              <div
                key={course.id}
                className="p-5 rounded-2xl bg-campus-bg border border-campus-secondary/80 flex flex-col justify-between hover:border-campus-primary/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-extrabold text-campus-primary bg-campus-secondary px-2.5 py-0.5 rounded-full">
                      {course.code}
                    </span>
                    <span className="text-xs text-campus-muted font-medium">
                      {course.credits} Credits • {course.department_code || 'CSE'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-campus-text line-clamp-1">{course.name}</h4>
                  <p className="text-xs text-campus-muted mt-1 line-clamp-2">{course.syllabus || 'Relational algorithms, distributed compute architecture.'}</p>
                  
                  <div className="mt-3 text-xs text-campus-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-campus-primary" />
                    <span>Faculty: <span className="font-semibold text-campus-text">{course.faculty_name || 'Prof. Turing'}</span></span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-campus-secondary/60 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${isFull ? 'text-campus-danger' : isCritical ? 'text-campus-warning' : 'text-campus-text'}`}>
                        {course.enrolled_count}/{course.max_seats} Seats
                      </span>
                      {isCritical && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-campus-warning/20 text-campus-warning rounded-full animate-pulse">
                          1 Left!
                        </span>
                      )}
                    </div>
                    <div className="w-24 bg-white rounded-full h-1.5 mt-1 border border-campus-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isFull ? 'bg-campus-danger' : isCritical ? 'bg-campus-warning' : 'bg-campus-primary'}`}
                        style={{ width: `${Math.min(100, (course.enrolled_count / course.max_seats) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {isRegistered ? (
                    <span className="text-xs font-bold text-campus-success bg-campus-success/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                    </span>
                  ) : isFull ? (
                    <span className="text-xs font-bold text-campus-muted bg-campus-secondary/40 px-3 py-1.5 rounded-full">
                      Class Full
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRegister(course)}
                      disabled={registeringId === course.id}
                      className="px-4 py-1.5 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-full text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                    >
                      {registeringId === course.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        'Register Course'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-campus-text/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-modal border border-campus-secondary space-y-4">
            <div className="w-16 h-16 rounded-full bg-campus-success/10 text-campus-success mx-auto flex items-center justify-center">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-xl text-campus-text">Registration Successful!</h3>
            <p className="text-xs text-campus-muted">
              You are officially registered for <span className="font-bold text-campus-text">{successModal.courseCode} — {successModal.courseName}</span>.
            </p>
            <div className="p-3 bg-campus-secondary/40 rounded-2xl text-xs font-semibold text-campus-text">
              Remaining available seats: {successModal.remainingSeats}
            </div>
            <button
              onClick={() => setSuccessModal(null)}
              className="w-full py-3 bg-campus-primary text-white rounded-full text-xs font-bold shadow-card"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
