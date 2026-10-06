import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldCheck, Filter, Clock, Search } from 'lucide-react';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [filterAction, setFilterAction] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.getAuditLogs({ action: filterAction });
        setLogs(res.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [filterAction]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 md:pb-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-card border border-campus-secondary flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-primary bg-campus-secondary/60 px-3 py-1 rounded-full">
            Security Compliance & Telemetry
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-campus-text tracking-tight mt-2">
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-campus-muted mt-1">
            Tamper-evident logs of logins, course transactions, attendance submissions, and grade entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-campus-muted" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 bg-campus-bg border border-campus-secondary rounded-full text-xs font-bold text-campus-text focus:outline-none"
          >
            <option value="">All Security Events</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="COURSE_REGISTER">COURSE_REGISTER</option>
            <option value="COURSE_DROP">COURSE_DROP</option>
            <option value="ENTER_MARKS">ENTER_MARKS</option>
            <option value="MARK_ATTENDANCE">MARK_ATTENDANCE</option>
            <option value="BROADCAST_NOTIFICATION">BROADCAST_NOTIFICATION</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl p-6 shadow-card border border-campus-secondary">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-campus-secondary text-campus-muted uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Actor / User</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Transaction Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-campus-secondary/40 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-campus-bg/60 transition-colors">
                  <td className="py-3 px-3 text-campus-muted whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-sans font-bold text-campus-text whitespace-nowrap">
                    {log.user_name || 'System'} <span className="text-[10px] text-campus-muted">({log.user_role || 'DAEMON'})</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      log.action.includes('FAIL') ? 'bg-campus-danger/10 text-campus-danger' :
                      log.action.includes('REGISTER') ? 'bg-campus-success/10 text-campus-success' :
                      log.action.includes('MARKS') ? 'bg-campus-warning/10 text-campus-warning' :
                      'bg-campus-secondary text-campus-primary'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans font-semibold text-campus-muted">
                    {log.entity} #{log.entity_id || ''}
                  </td>
                  <td className="py-3 px-3 text-campus-muted">{log.ip_address || '127.0.0.1'}</td>
                  <td className="py-3 px-3 text-[11px] text-campus-muted max-w-sm truncate">
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '')}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-sans text-campus-muted">
                    No audit records matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
