import React, { useState } from 'react';
import { usePothole } from '../context/PotholeContext';
import { Complaint, PriorityLevel } from '../types';
import {
  ShieldCheck,
  UserCheck,
  Calendar,
  AlertOctagon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Mail,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { ComplaintListSkeleton, BackendSyncBanner } from './LoadingSkeleton';

interface OfficerDashboardProps {
  onSelectComplaint: (complaint: Complaint) => void;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ onSelectComplaint }) => {
  const {
    complaints,
    engineers,
    assignComplaint,
    completeRepair,
    reopenComplaint,
    calculateDaysIgnored,
    emailLogs,
    retryEmailNotification,
    isLoadingBackend,
    refreshBackend
  } = usePothole();

  // Assignment Modal State
  const [assigningComplaint, setAssigningComplaint] = useState<Complaint | null>(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>(engineers[0]?.id || '');
  const [deadline, setDeadline] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<PriorityLevel>('High');
  const [officerNotes, setOfficerNotes] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Tab: Complaints Management or Email Logs
  const [activeTab, setActiveTab] = useState<'roster' | 'emails'>('roster');
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  const handleRetryEmail = async (logId: string) => {
    setRetryingLogId(logId);
    try {
      await retryEmailNotification(logId);
    } catch (err) {
      console.error('Failed to retry email dispatch', err);
    } finally {
      setRetryingLogId(null);
    }
  };

  const pendingCount = complaints.filter((c) => c.status === 'Pending').length;
  const assignedCount = complaints.filter((c) => c.status === 'Assigned').length;
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length;
  const completedCount = complaints.filter((c) => c.status === 'Completed').length;
  const overdueCount = complaints.filter(
    (c) => c.status !== 'Completed' && c.status !== 'Rejected' && calculateDaysIgnored(c) > 5
  ).length;

  const handleQuickMarkFixed = async (c: Complaint) => {
    // Quick officer action as shown in the video demo
    const sampleRepairedPhoto = c.photoUrl; // Or patch image
    await completeRepair(
      c.id,
      sampleRepairedPhoto,
      'Marked as fixed by Municipal Officer inspection.',
      'Cold-mix bitumen temporary patch'
    );
  };

  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint) return;
    setIsAssigning(true);

    try {
      await assignComplaint(
        assigningComplaint.id,
        selectedEngineerId,
        deadline,
        priority,
        officerNotes
      );
      setAssigningComplaint(null);
      setOfficerNotes('');
    } catch (err) {
      console.error('Assignment error', err);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Backend Sync Banner */}
      <BackendSyncBanner
        isLoading={isLoadingBackend}
        onRefresh={refreshBackend}
        message="Syncing municipal complaints with Render backend..."
      />

      {/* Officer Header matching video: "Officer panel" */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Officer panel</span>
                {isLoadingBackend && (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                )}
              </h1>
            </div>
            {/* Exact subtext matching video screenshot 36 */}
            <p className="text-xs text-slate-600 mt-1">
              Mark a complaint as Fixed and its pin turns green on the public map.
            </p>
          </div>

          {/* Sub-tabs & Refresh */}
          <div className="flex items-center gap-2">
            <button
              onClick={refreshBackend}
              disabled={isLoadingBackend}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh from backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackend ? 'animate-spin text-amber-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Complaints Action
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'emails'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>Municipal Alerts ({emailLogs.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Municipal Quick Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-100 text-center">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="text-lg font-black text-slate-900">{complaints.length}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Total Reports</div>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-200">
            <div className="text-lg font-black text-rose-600">{pendingCount}</div>
            <div className="text-[10px] text-rose-700 font-bold uppercase">Pending</div>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <div className="text-lg font-black text-amber-600">{assignedCount + inProgressCount}</div>
            <div className="text-[10px] text-amber-700 font-bold uppercase">In Work</div>
          </div>
          <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
            <div className="text-lg font-black text-emerald-600">{completedCount}</div>
            <div className="text-[10px] text-emerald-700 font-bold uppercase">Fixed</div>
          </div>
          <div className="bg-rose-100/60 p-2.5 rounded-xl border border-rose-300 col-span-2 sm:col-span-1">
            <div className="text-lg font-black text-rose-800">{overdueCount}</div>
            <div className="text-[10px] text-rose-800 font-bold uppercase">Overdue (&gt;5d)</div>
          </div>
        </div>
      </div>

      {/* Main Roster or Email Logs */}
      {activeTab === 'roster' ? (
        <div className="space-y-3">
          {isLoadingBackend && complaints.length === 0 ? (
            <ComplaintListSkeleton count={4} />
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
              No complaints in municipal queue.
            </div>
          ) : (
            complaints.map((c) => {
            const days = calculateDaysIgnored(c);
            const isFixed = c.status === 'Completed';

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left side: Photo & details matching video layout */}
                <div
                  onClick={() => onSelectComplaint(c)}
                  className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 cursor-pointer"
                >
                  <img
                    src={c.photoUrl}
                    alt="Pothole"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 bg-slate-900 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    {/* ID & Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {c.id.replace('PIQ-', '#')}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isFixed
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : c.status === 'Assigned'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.status}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold lowercase ${
                          c.estimatedSeverity === 'Dangerous'
                            ? 'bg-rose-50 text-rose-700'
                            : c.estimatedSeverity === 'Medium'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {c.estimatedSeverity.toLowerCase()}
                      </span>
                    </div>

                    {/* AI Confidence & Ignored Counter line */}
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                      <span>AI confidence {(c.aiConfidence * 100).toFixed(0)}%</span>
                      <span>·</span>
                      {isFixed ? (
                        <span className="text-emerald-700 font-semibold">fixed</span>
                      ) : (
                        <span className="text-amber-800 font-semibold">
                          ignored for {days} days
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-1">
                      {c.address}
                      {c.assignedEngineerName && (
                        <span className="ml-2 font-semibold text-slate-700">
                          (Assigned: {c.assignedEngineerName})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Action Buttons matching video screenshot 36-42 */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Assign to Engineer Button */}
                  {!isFixed && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningComplaint(c);
                        setSelectedEngineerId(engineers[0]?.id || '');
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                      <span>{c.assignedEngineerId ? 'Reassign' : 'Assign'}</span>
                    </button>
                  )}

                  {/* Exact [Mark Fixed] Button from video screenshot 36-38 */}
                  {!isFixed ? (
                    <button
                      type="button"
                      onClick={() => handleQuickMarkFixed(c)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 transition-colors shadow-sm cursor-pointer"
                    >
                      Mark Fixed
                    </button>
                  ) : (
                    /* Exact [Reopen] Button from video screenshot 39-42 */
                    <button
                      type="button"
                      onClick={() => reopenComplaint(c.id)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 transition-colors shadow-sm cursor-pointer"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            );
          }))}
        </div>
      ) : (
        /* Municipal Dispatch Email Logs Inspector */
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-amber-600" />
              <span>Municipal Office Notification Dispatch Logs</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Firestore &lsquo;mail&rsquo; queue schema
            </span>
          </div>

          {emailLogs.map((log) => {
            const isSent = log.status === 'sent' || log.status === 'delivered';
            const isFailed = log.status === 'failed';

            return (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-900">{log.subject}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.sentAt).toLocaleTimeString()}
                    </span>

                    {/* Display status: "Email sent" or "Email failed, retry" */}
                    {isSent ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Email sent
                      </span>
                    ) : isFailed ? (
                      <button
                        onClick={() => handleRetryEmail(log.id)}
                        disabled={retryingLogId === log.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
                        title={
                          log.errorMessage
                            ? `Error: ${log.errorMessage}. Click to retry.`
                            : 'Click to retry email dispatch'
                        }
                      >
                        <RotateCcw
                          className={`w-3.5 h-3.5 text-rose-700 ${
                            retryingLogId === log.id ? 'animate-spin' : ''
                          }`}
                        />
                        <span>
                          {retryingLogId === log.id ? 'Retrying...' : 'Email failed, retry'}
                        </span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Email sent
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 font-mono">
                  <span>
                    Recipient: {log.recipientEmail} · Event: {log.eventType}
                  </span>
                  {log.errorMessage && isFailed && (
                    <span className="text-rose-600 font-medium font-sans">
                      Reason: {log.errorMessage}
                    </span>
                  )}
                </div>

                <pre className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 whitespace-pre-wrap font-sans">
                  {log.body}
                </pre>
              </div>
            );
          })}
        </div>
      )}

      {/* Engineer Assignment Modal */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">
                Assign Work Order: {assigningComplaint.id}
              </h3>
              <button
                onClick={() => setAssigningComplaint(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Registered Municipal Engineer:
                </label>
                <select
                  value={selectedEngineerId}
                  onChange={(e) => setSelectedEngineerId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800"
                >
                  {engineers.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name} — {eng.specialization} ({eng.activeTasksCount} active tasks)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Repair Deadline:
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Work Priority:
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent (Dangerous Pothole)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Officer Technical Instructions:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. High two-wheeler corridor. Mill damaged bitumen 50mm, use hot-mix DAC Grade II."
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningComplaint(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Confirm & Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
