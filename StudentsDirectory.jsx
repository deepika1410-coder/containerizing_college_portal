import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Users, Search, GraduationCap, Mail, Phone } from 'lucide-react';

export default function StudentsDirectory() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await api.getAllStudents({ search, department });
        setStudents(res.students || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, [search, department]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Student Information System
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Enrolled Student Roster
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Directory of enrolled students with contact records and academic standing.
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-campus-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name or reg no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-campus-bg border border-campus-secondary rounded-full text-xs text-campus-text focus:outline-none"
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-1.5 bg-campus-bg border border-campus-secondary rounded-full text-xs font-semibold text-campus-text focus:outline-none"
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="AIDS">AIDS</option>
            <option value="MECH">MECH</option>
          </select>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <div
            key={student.id}
            className="p-5 rounded-3xl bg-white border border-campus-secondary shadow-card flex items-start gap-4 hover:border-campus-primary/40 transition-all"
          >
            <img
              src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt=""
              className="w-12 h-12 rounded-full object-cover border-2 border-campus-secondary flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-campus-primary bg-campus-secondary px-2 py-0.5 rounded-full">
                  {student.register_number}
                </span>
                <span className="text-xs font-bold text-campus-text">CGPA {student.cgpa}</span>
              </div>
              <h4 className="font-bold text-sm text-campus-text mt-1 truncate">{student.name}</h4>
              <p className="text-xs text-campus-muted">{student.department_code || 'CSE'} • Year {student.year}, Sem {student.semester} (Sec {student.section || 'A'})</p>

              <div className="mt-3 pt-2 border-t border-campus-secondary/60 flex items-center justify-between text-[11px] text-campus-muted">
                <span className="flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 text-campus-primary" /> {student.email}
                </span>
              </div>
            </div>
          </div>
        ))}

        {students.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-campus-muted bg-white rounded-3xl border border-campus-secondary">
            No students found matching search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
