import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Award,
  TrendingUp,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Save,
  Send
} from 'lucide-react';

export default function ResultsView() {
  const { user } = useAuth();
  const isFaculty = user?.role === 'FACULTY';
  const isAdmin = user?.role === 'ADMIN';

  // Student State
  const [semester, setSemester] = useState('5');
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Faculty Marks Entry State
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [roster, setRoster] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [internalMarks, setInternalMarks] = useState('');
  const [externalMarks, setExternalMarks] = useState('');
  const [savingMarks, setSavingMarks] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadStudentResults = async () => {
    try {
      const res = await api.getMyResults(semester);
      setResultsData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isFaculty && !isAdmin) {
      loadStudentResults();
    }
  }, [semester, isFaculty, isAdmin]);

  // Load faculty courses
  useEffect(() => {
    if (isFaculty || isAdmin) {
      api.getCourses().then(res => {
        setCourses(res.courses || []);
        if (res.courses?.length > 0) setSelectedCourse(res.courses[0].id);
      });
    }
  }, [isFaculty, isAdmin]);

  // Load roster when course changes
  useEffect(() => {
    if (!selectedCourse) return;
    api.getCourseRoster(selectedCourse).then(res => {
      setRoster(res.students || []);
      if (res.students?.length > 0) setSelectedStudent(res.students[0].student_id);
    });
  }, [selectedCourse]);

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCourse) return;

    setSavingMarks(true);
    setFeedback(null);
    try {
      const res = await api.enterMarks({
        studentId: Number(selectedStudent),
        courseId: Number(selectedCourse),
        semester: 5,
        internalMarks: Number(internalMarks),
        externalMarks: Number(externalMarks)
      });
      setFeedback({ type: 'success', message: res.message });
      setInternalMarks('');
      setExternalMarks('');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update marks. Result might be locked.' });
    } finally {
      setSavingMarks(false);
    }
  };

  const handleAdminPublish = async (isPublished, isLocked) => {
    try {
      const res = await api.setPublishStatus({
        courseId: Number(selectedCourse),
        semester: 5,
        isPublished,
        isLocked
      });
      alert(res.message);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Examination & Grade Ledger
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Academic Performance & Results
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Backend-calculated grades, semester GPA, and cumulative CGPA verified by the Academic Board.
          </p>
        </div>

        {!isFaculty && !isAdmin && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-campus-muted uppercase">Semester:</span>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="px-3 py-1.5 bg-campus-bg border border-campus-secondary rounded-full text-xs font-bold text-campus-text focus:outline-none"
            >
              <option value="5">Semester 5 (Current)</option>
              <option value="4">Semester 4</option>
              <option value="3">Semester 3</option>
            </select>
          </div>
        )}
      </div>

      {/* STUDENT RESULTS VIEW */}
      {!isFaculty && !isAdmin && (
        <>
          {/* GPA & CGPA Banner Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary">
              <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Semester {semester} GPA</span>
              <div className="text-3xl font-extrabold text-campus-text mt-2">
                {resultsData?.semesterGpa || '8.85'}
              </div>
              <span className="text-xs text-campus-muted">Based on published grades</span>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary">
              <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Cumulative CGPA</span>
              <div className="text-3xl font-extrabold text-campus-primary mt-2">
                {resultsData?.cgpa || '8.85'}
              </div>
              <span className="text-xs text-campus-muted">Overall Academic Standing</span>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-card border border-campus-secondary">
              <span className="text-xs font-bold uppercase tracking-wider text-campus-muted">Total Credits</span>
              <div className="text-3xl font-extrabold text-campus-text mt-2">
                {resultsData?.totalCredits || 14} Cr
              </div>
              <span className="text-xs text-campus-muted">Completed in Semester {semester}</span>
            </div>
          </div>

          {/* Detailed Subject Marks Table */}
          <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
            <h3 className="font-extrabold text-base text-campus-text mb-1">Official Grade Statement</h3>
            <p className="text-xs text-campus-muted mb-4">Internal and external examination scores computed by the Controller of Examinations</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-campus-secondary text-campus-muted uppercase text-[10px]">
                    <th className="py-2.5 px-3">Subject Code</th>
                    <th className="py-2.5 px-3">Subject Title</th>
                    <th className="py-2.5 px-3">Internal (30)</th>
                    <th className="py-2.5 px-3">External (70)</th>
                    <th className="py-2.5 px-3">Total (100)</th>
                    <th className="py-2.5 px-3">Grade</th>
                    <th className="py-2.5 px-3">Grade Point</th>
                    <th className="py-2.5 px-3 text-right">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-campus-secondary/40">
                  {(resultsData?.results || []).map((r) => (
                    <tr key={r.id} className="hover:bg-campus-bg/60 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-campus-primary">{r.course_code}</td>
                      <td className="py-3 px-3 font-bold text-campus-text">{r.course_name}</td>
                      <td className="py-3 px-3">{r.internal_marks} / 30</td>
                      <td className="py-3 px-3">{r.external_marks} / 70</td>
                      <td className="py-3 px-3 font-bold text-campus-text">{r.total_marks} / 100</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                          r.grade === 'O' || r.grade === 'A+' ? 'bg-campus-success/15 text-campus-success' :
                          r.grade === 'A' || r.grade === 'B+' ? 'bg-campus-secondary text-campus-primary' :
                          'bg-campus-warning/15 text-campus-warning'
                        }`}>
                          {r.grade}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-campus-text">{r.grade_point}</td>
                      <td className="py-3 px-3 text-right font-medium">{r.credits}</td>
                    </tr>
                  ))}
                  {resultsData?.results?.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-campus-muted">
                        No published results found for this semester.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* FACULTY MARKS ENTRY WORKSPACE */}
      {(isFaculty || isAdmin) && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-campus-text">Faculty Marks Entry & Evaluation</h3>
              <p className="text-xs text-campus-muted">
                Grades and GPAs are computed server-side. Once locked by administration, entries become read-only.
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAdminPublish(true, false)}
                  className="px-3 py-1.5 bg-campus-success text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" /> Publish Results
                </button>
                <button
                  onClick={() => handleAdminPublish(true, true)}
                  className="px-3 py-1.5 bg-campus-text text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Lock Results
                </button>
              </div>
            )}
          </div>

          {feedback && (
            <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success' ? 'bg-campus-success/10 text-campus-success border border-campus-success/20' : 'bg-campus-danger/10 text-campus-danger border border-campus-danger/20'
            }`}>
              {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <form onSubmit={handleSaveMarks} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                  Select Subject
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
                  Select Student
                </label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-bold text-campus-text focus:outline-none"
                >
                  {roster.map(s => (
                    <option key={s.student_id} value={s.student_id}>
                      {s.register_number} — {s.student_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                  Internal Marks (Max 30)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  placeholder="e.g. 28.5"
                  value={internalMarks}
                  onChange={(e) => setInternalMarks(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-semibold text-campus-text focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                  External Exam Marks (Max 70)
                </label>
                <input
                  type="number"
                  min="0"
                  max="70"
                  step="0.5"
                  placeholder="e.g. 62.0"
                  value={externalMarks}
                  onChange={(e) => setExternalMarks(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-semibold text-campus-text focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Live calculation preview */}
            {internalMarks && externalMarks && (
              <div className="p-3 bg-campus-secondary/40 border border-campus-secondary rounded-2xl flex items-center justify-between text-xs">
                <span className="text-campus-muted font-medium">Estimated Total Score:</span>
                <span className="font-extrabold text-campus-primary text-sm">
                  {Number(internalMarks) + Number(externalMarks)} / 100
                </span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingMarks || !selectedStudent}
                className="px-6 py-2.5 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-full text-xs font-bold shadow-card transition-all flex items-center gap-2"
              >
                {savingMarks ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save & Compute Grade
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
