import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BookOpen, Plus, Trash2, Edit2, CheckCircle2, Clock } from 'lucide-react';

export default function CoursesManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [semester, setSemester] = useState('5');
  const [credits, setCredits] = useState('3');
  const [maxSeats, setMaxSeats] = useState('60');
  const [departmentId, setDepartmentId] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  const loadCourses = async () => {
    try {
      const res = await api.getCourses();
      setCourses(res.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createCourse({
        code,
        name,
        semester: Number(semester),
        credits: Number(credits),
        max_seats: Number(maxSeats),
        department_id: Number(departmentId)
      });
      setShowCreateModal(false);
      setCode('');
      setName('');
      loadCourses();
    } catch (err) {
      alert(err.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.deleteCourse(id);
      loadCourses();
    } catch (err) {
      alert(err.message || 'Failed to delete course');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Curriculum Registry
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Course Management & Capacity
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Configure seat capacities, credit weights, and course listings across all university departments.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-full text-xs font-bold shadow-card transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Course
        </button>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-campus-secondary text-campus-muted uppercase text-[10px]">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Course Name</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Semester</th>
                <th className="py-2.5 px-3">Credits</th>
                <th className="py-2.5 px-3">Capacity</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campus-secondary/40">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-campus-bg/60 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-campus-primary">{course.code}</td>
                  <td className="py-3 px-3 font-bold text-campus-text">{course.name}</td>
                  <td className="py-3 px-3 font-semibold text-campus-muted">{course.department_code || 'CSE'}</td>
                  <td className="py-3 px-3">Sem {course.semester}</td>
                  <td className="py-3 px-3">{course.credits} Cr</td>
                  <td className="py-3 px-3">
                    <span className="font-extrabold text-campus-text">
                      {course.enrolled_count} / {course.max_seats}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-1.5 rounded-xl hover:bg-campus-danger/10 text-campus-danger transition-colors text-xs"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-campus-text/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-modal border border-campus-secondary">
            <h3 className="font-extrabold text-xl text-campus-text">Add New Course</h3>
            <p className="text-xs text-campus-muted mt-1">Define course code, department, and quota limits.</p>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS507"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-bold text-campus-text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs font-bold text-campus-text"
                  >
                    <option value="1">CSE</option>
                    <option value="2">ECE</option>
                    <option value="3">AIDS</option>
                    <option value="4">MECH</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Quantum Computing & Crypto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs text-campus-text"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs text-campus-text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs text-campus-text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-campus-muted uppercase mb-1">Max Seats</label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(e.target.value)}
                    className="w-full p-2.5 bg-campus-bg border border-campus-secondary rounded-2xl text-xs text-campus-text"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-campus-muted hover:text-campus-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-campus-primary text-white text-xs font-bold rounded-full shadow-card hover:bg-campus-primary-dark"
                >
                  {submitting ? 'Creating...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
