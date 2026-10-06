import React, { useState } from 'react';
import { api } from '../services/api';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPassword({ token, onBackToLogin }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Token is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-campus-bg p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-modal border border-campus-secondary p-8 sm:p-10 animate-fadeIn">
        <button
          onClick={onBackToLogin}
          className="inline-flex items-center gap-2 text-xs font-bold text-campus-muted hover:text-campus-text transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <h2 className="text-2xl font-extrabold text-campus-text tracking-tight">Set New Password</h2>
        <p className="text-xs text-campus-muted mt-1.5 leading-relaxed">
          Your reset token has been verified against the secure database registry.
        </p>

        {success ? (
          <div className="mt-6 p-5 bg-campus-secondary/50 border border-campus-secondary rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-campus-success mx-auto" />
            <h3 className="font-bold text-sm text-campus-text">Password Updated!</h3>
            <p className="text-xs text-campus-muted">
              Your password has been securely re-hashed with bcrypt. You can now log in with your new credentials.
            </p>
            <button
              onClick={onBackToLogin}
              className="mt-4 px-5 py-2 bg-campus-primary text-white rounded-full text-xs font-bold shadow-card"
            >
              Sign In Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="p-3 bg-campus-danger/10 border border-campus-danger/20 rounded-2xl text-xs font-semibold text-campus-danger">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-campus-muted absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-campus-bg border border-campus-secondary rounded-2xl text-sm text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-campus-muted mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-campus-muted absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-campus-bg border border-campus-secondary rounded-2xl text-sm text-campus-text placeholder-campus-muted focus:outline-none focus:border-campus-primary transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-2xl text-sm font-bold shadow-card transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
