import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Lock, Mail, ArrowRight, Shield, Briefcase, UserCheck } from 'lucide-react';

export default function Login({ onForgotPassword }) {
  const { login, loginWithDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (role) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithDemo(role);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-campus-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-modal border border-campus-secondary p-8 sm:p-10 animate-fadeIn">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-campus-primary text-white rounded-3xl mx-auto flex items-center justify-center shadow-card mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight">
            Campus<span className="text-campus-primary">Flow</span>
          </h1>
          <p className="text-xs sm:text-sm text-campus-muted mt-1.5 font-medium">
            Smart College Portal — Reliable, Scalable & DevOps Ready
          </p>
        </div>

        {/* Demo Quick-Login Pills */}
        <div className="mb-6 p-3 bg-campus-secondary/40 border border-campus-secondary rounded-2xl">
          <div className="text-[11px] font-bold uppercase tracking-wider text-campus-muted mb-2 text-center">
            Quick Demo 1-Click Access
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoClick('STUDENT')}
              disabled={loading}
              className="px-2 py-2 bg-white hover:bg-campus-secondary text-campus-text hover:text-campus-primary rounded-xl text-xs font-semibold border border-campus-secondary shadow-sm transition-all flex flex-col items-center gap-1"
            >
              <UserCheck className="w-4 h-4 text-campus-primary" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('FACULTY')}
              disabled={loading}
              className="px-2 py-2 bg-white hover:bg-campus-secondary text-campus-text hover:text-campus-primary rounded-xl text-xs font-semibold border border-campus-secondary shadow-sm transition-all flex flex-col items-center gap-1"
            >
              <Briefcase className="w-4 h-4 text-campus-primary" />
              <span>Faculty</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('ADMIN')}
              disabled={loading}
              className="px-2 py-2 bg-white hover:bg-campus-secondary text-campus-text hover:text-campus-primary rounded-xl text-xs font-semibold border border-campus-secondary shadow-sm transition-all flex flex-col items-center gap-1"
            >
              <Shield className="w-4 h-4 text-campus-primary" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 p-3.5 bg-campus-danger/10 border border-campus-danger/20 rounded-2xl text-xs font-semibold text-campus-danger">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
              Email / Register Number
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-campus-muted absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="student@campusflow.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-campus-bg border border-campus-secondary rounded-2xl text-sm text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-primary transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-campus-muted">
                Password
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-xs font-semibold text-campus-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-campus-muted absolute left-3.5 top-3.5" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-campus-bg border border-campus-secondary rounded-2xl text-sm text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-primary transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-2xl text-sm font-bold shadow-card transition-all flex items-center justify-center gap-2 group mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-campus-muted">
          Protected by CampusFlow RBAC & PostgreSQL ACID Transactions
        </div>
      </div>
    </div>
  );
}
