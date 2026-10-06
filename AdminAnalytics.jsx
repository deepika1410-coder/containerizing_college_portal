import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BarChart3, PieChart, TrendingUp, Users, BookOpen, Award } from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await api.getAdminAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Institutional Business Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Campus Analytics & Academic Performance
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Aggregated institutional statistics across enrollment, grades, and department distributions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Enrollment Distribution */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
          <h3 className="font-extrabold text-base text-campus-text mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-campus-primary" /> Students by Academic Department
          </h3>
          <p className="text-xs text-campus-muted mb-6">Departmental distribution across enrolled undergraduate cohorts</p>

          <div className="space-y-4">
            {(data?.departmentDistribution || []).map((dept, idx) => (
              <div key={idx} className="p-4 bg-campus-bg rounded-2xl border border-campus-secondary/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-campus-text">{dept.name} ({dept.code})</span>
                  <span className="text-xs font-extrabold text-campus-primary">{dept.student_count} Students</span>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-campus-secondary">
                  <div
                    className="bg-campus-primary h-full rounded-full"
                    style={{ width: `${Math.min(100, (Number(dept.student_count) / 4) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
          <h3 className="font-extrabold text-base text-campus-text mb-1 flex items-center gap-2">
            <Award className="w-5 h-5 text-campus-primary" /> Institutional Grade Distribution
          </h3>
          <p className="text-xs text-campus-muted mb-6">Verified university examination grade outcomes</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(data?.gradeDistribution || []).map((gradeItem, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-campus-bg border border-campus-secondary/60 text-center">
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  gradeItem.grade === 'O' || gradeItem.grade === 'A+' ? 'bg-campus-success/15 text-campus-success' :
                  gradeItem.grade === 'A' || gradeItem.grade === 'B+' ? 'bg-campus-secondary text-campus-primary' :
                  'bg-campus-warning/15 text-campus-warning'
                }`}>
                  Grade {gradeItem.grade}
                </span>
                <div className="text-2xl font-extrabold text-campus-text mt-3">
                  {gradeItem.count}
                </div>
                <span className="text-[11px] text-campus-muted">Students</span>
              </div>
            ))}
            {(!data?.gradeDistribution || data.gradeDistribution.length === 0) && (
              <div className="col-span-full py-8 text-center text-xs text-campus-muted">
                No published exam results in current semester.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
