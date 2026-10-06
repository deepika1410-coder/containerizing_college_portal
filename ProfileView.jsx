import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Phone, Mail, GraduationCap, Building, Award, Save, CheckCircle } from 'lucide-react';

export default function ProfileView() {
  const { user, refreshUser } = useAuth();
  const [phone, setPhone] = useState(user?.phone || '+1-555-0103');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await api.updateProfile({ phone, avatar_url: avatarUrl });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex items-center gap-5">
        <img
          src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt=""
          className="w-20 h-20 rounded-full object-cover border-4 border-campus-secondary shadow-card"
        />
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary px-3 py-1 rounded-full">
            {user?.role} Profile
          </span>
          <h1 className="text-2xl font-extrabold text-campus-text tracking-tight mt-1.5">{user?.name}</h1>
          <p className="text-xs sm:text-sm text-campus-muted">
            {user?.role === 'STUDENT' ? `Register No: ${user?.register_number || '2024CS101'}` : `Employee ID: ${user?.employee_id || 'FAC-1001'}`} • {user?.department_name || 'Computer Science & Engineering'}
          </p>
        </div>
      </div>

      {/* Academic Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary">
        <h3 className="font-extrabold text-base text-campus-text mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-campus-primary" /> Academic Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-campus-bg rounded-2xl border border-campus-secondary/60">
            <span className="text-[10px] font-bold uppercase text-campus-muted">Department</span>
            <div className="font-bold text-sm text-campus-text mt-1">{user?.department_name || 'Computer Science'}</div>
          </div>
          <div className="p-4 bg-campus-bg rounded-2xl border border-campus-secondary/60">
            <span className="text-[10px] font-bold uppercase text-campus-muted">Department Code</span>
            <div className="font-bold text-sm text-campus-text mt-1">{user?.department_code || 'CSE'}</div>
          </div>
          {user?.role === 'STUDENT' && (
            <>
              <div className="p-4 bg-campus-bg rounded-2xl border border-campus-secondary/60">
                <span className="text-[10px] font-bold uppercase text-campus-muted">Current Standing</span>
                <div className="font-bold text-sm text-campus-text mt-1">Year {user?.year || 3}, Semester {user?.semester || 5} (Sec {user?.section || 'A'})</div>
              </div>
              <div className="p-4 bg-campus-bg rounded-2xl border border-campus-secondary/60">
                <span className="text-[10px] font-bold uppercase text-campus-muted">Cumulative CGPA</span>
                <div className="font-extrabold text-lg text-campus-primary mt-1">{user?.cgpa || '8.85'} / 10.0</div>
              </div>
            </>
          )}
          {user?.role === 'FACULTY' && (
            <div className="p-4 bg-campus-bg rounded-2xl border border-campus-secondary/60">
              <span className="text-[10px] font-bold uppercase text-campus-muted">Designation</span>
              <div className="font-bold text-sm text-campus-text mt-1">{user?.designation || 'Associate Professor'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Editable Contact Info Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary">
        <h3 className="font-extrabold text-base text-campus-text mb-2">Edit Contact & Profile Details</h3>
        <p className="text-xs text-campus-muted mb-6">Update contact number and profile avatar. Verified academic records are read-only.</p>

        {success && (
          <div className="p-4 mb-4 bg-campus-success/10 border border-campus-success/20 rounded-2xl text-xs font-bold text-campus-success flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                Primary Email (Read-Only)
              </label>
              <input
                type="text"
                value={user?.email || ''}
                disabled
                className="w-full p-3 bg-campus-secondary/30 border border-campus-secondary rounded-2xl text-xs font-semibold text-campus-muted cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-3 bg-campus-bg border border-campus-secondary rounded-2xl text-xs text-campus-text focus:outline-none focus:border-campus-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-3 bg-campus-bg border border-campus-secondary rounded-2xl text-xs text-campus-text focus:outline-none focus:border-campus-primary"
            />
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-full text-xs font-bold shadow-card transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
