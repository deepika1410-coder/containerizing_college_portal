import React, { useState } from 'react';
import { api } from '../services/api';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.forgotPassword(email);
      setSubmitted(true);
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
    } catch (err) {
      setError(err.message || 'Unable to process reset request.');
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

        <h2 className="text-2xl font-extrabold text-campus-text tracking-tight">Reset Password</h2>
        <p className="text-xs text-campus-muted mt-1.5 leading-relaxed">
          Enter the verified email address linked to your CampusFlow academic account.
        </p>

        {submitted ? (
          <div className="mt-6 p-5 bg-campus-secondary/50 border border-campus-secondary rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-campus-success mx-auto" />
            <h3 className="font-bold text-sm text-campus-text">Reset Link Dispatched</h3>
            <p className="text-xs text-campus-muted">
              If an account is associated with <span className="font-semibold text-campus-text">{email}</span>, a single-use crypto-secure token has been generated.
            </p>
            {devResetUrl && (
              <div className="mt-3 p-3 bg-white border border-campus-secondary rounded-xl text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-campus-primary mb-1">
                  Local Dev Mailbox Simulation:
                </div>
                <a
                  href={devResetUrl}
                  className="text-xs text-campus-primary break-all hover:underline font-mono"
                >
                  {devResetUrl}
                </a>
              </div>
            )}
            <button
              onClick={onBackToLogin}
              className="mt-4 px-5 py-2 bg-campus-primary text-white rounded-full text-xs font-bold shadow-card"
            >
              Return to Login
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
                Academic Email
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-campus-primary hover:bg-campus-primary-dark text-white rounded-2xl text-sm font-bold shadow-card transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Generate Secure Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
