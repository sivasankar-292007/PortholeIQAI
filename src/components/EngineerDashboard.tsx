import React, { useState } from 'react';
import { usePothole } from '../context/PotholeContext';
import { Complaint } from '../types';
import { SAMPLE_IMAGES } from '../data/sampleImages';
import {
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Upload,
  Play,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Check,
  RefreshCw,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EngineerWorkOrderSkeleton, BackendSyncBanner } from './LoadingSkeleton';

interface EngineerDashboardProps {
  onSelectComplaint: (complaint: Complaint) => void;
}

export const EngineerDashboard: React.FC<EngineerDashboardProps> = ({ onSelectComplaint }) => {
  const {
    currentUser,
    complaints,
    startRepair,
    completeRepair,
    calculateDaysIgnored,
    isLoadingBackend,
    refreshBackend
  } = usePothole();

  // Completion modal state
  const [completingComplaint, setCompletingComplaint] = useState<Complaint | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string>(SAMPLE_IMAGES.repairedRoad);
  const [repairNotes, setRepairNotes] = useState<string>(
    'Cleaned debris, applied SS-1 tack coat emulsion, laid dense bituminous macadam (DBM) and compacted with 8-ton vibratory roller. Repainted yellow lane marking.'
  );
  const [materialsUsed, setMaterialsUsed] = useState<string>(
    '0.8 tons Hot-Mix Bitumen, Tack Coat emulsion, Thermoplastic yellow paint'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filter complaints assigned to this engineer
  const assignedToMe = complaints.filter(
    (c) => c.assignedEngineerId === currentUser.id || c.assignedEngineerName === currentUser.name
  );

  const activeTasks = assignedToMe.filter((c) => c.status === 'Assigned' || c.status === 'In Progress');
  const completedTasks = assignedToMe.filter((c) => c.status === 'Completed');

  const handleStartTask = async (c: Complaint) => {
    await startRepair(c.id);
  };

  const handleConfirmCompletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingComplaint) return;
    setIsSubmitting(true);

    try {
      await completeRepair(
        completingComplaint.id,
        afterPhoto,
        repairNotes,
        materialsUsed
      );
      setCompletingComplaint(null);
      confetti({
        particleCount: 70,
        spread: 50,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Completion error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Backend Sync Banner */}
      <BackendSyncBanner
        isLoading={isLoadingBackend}
        onRefresh={refreshBackend}
        message="Syncing engineer work orders with live Render backend..."
      />

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Engineer Work Orders: {currentUser.name}</span>
                {isLoadingBackend && (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.department || 'Roads & Asphalt Pavement Div'} · SDG 11 Maintenance Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={refreshBackend}
              disabled={isLoadingBackend}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer mr-1"
              title="Refresh work orders from backend"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBackend ? 'animate-spin text-amber-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg">
              {activeTasks.length} Active Work Orders
            </span>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg">
              {completedTasks.length} Repairs Verified
            </span>
          </div>
        </div>
      </div>

      {/* Active Work Orders */}
      <div className="mb-6">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Active Assigned Tasks ({activeTasks.length})</span>
        </div>

        {isLoadingBackend && activeTasks.length === 0 ? (
          <EngineerWorkOrderSkeleton count={2} />
        ) : activeTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">All Assigned Repairs Completed!</p>
            <p className="text-slate-400 mt-1">
              Check back when municipal dispatch assigns new road damage work orders.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTasks.map((c) => {
              const days = calculateDaysIgnored(c);
              const isInProgress = c.status === 'In Progress';

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top strip */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">
                          {c.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            isInProgress
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          c.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.priority} Priority
                      </span>
                    </div>

                    {/* Photo with damage tag */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-3 bg-slate-900">
                      <img
                        src={c.photoUrl}
                        alt="Road Damage"
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded">
                        Severity: {c.estimatedSeverity} · AI Conf: {(c.aiConfidence * 100).toFixed(0)}%
                      </div>
                    </div>

                    {/* Location & Instructions */}
                    <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="font-medium text-slate-800">{c.address}</span>
                      </div>
                      {c.repairDeadline && (
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" />
                          <span>Deadline: {c.repairDeadline}</span>
                        </div>
                      )}
                      {c.officerNotes && (
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-700">
                          <strong>Officer note:</strong> {c.officerNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Directions</span>
                    </a>

                    {!isInProgress ? (
                      <button
                        onClick={() => handleStartTask(c)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start Repair</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setCompletingComplaint(c)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Upload Proof & Finish</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Repair History */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Completed Repair Verification History ({completedTasks.length})</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
          {completedTasks.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No completed work orders yet.
            </div>
          ) : (
            completedTasks.map((c) => (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={c.afterPhotoUrl || c.photoUrl}
                    alt="Repaired Road"
                    className="w-14 h-14 rounded-lg object-cover border border-emerald-300"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">
                        {c.id}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded">
                        Fixed & Verified
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 truncate max-w-sm">
                      {c.address}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Completed: {c.completedAt ? new Date(c.completedAt).toLocaleDateString() : 'Recent'} · Days ignored: {c.daysIgnored}d
                    </div>
                  </div>
                </div>
                <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <span>View Report</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Complete Repair Modal with After-Photo Upload */}
      {completingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Submit Repair Completion: {completingComplaint.id}</span>
              </h3>
              <button
                onClick={() => setCompletingComplaint(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="space-y-4 text-xs">
              {/* After Photo Upload & Presets */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Upload After-Repair Photograph (Proof):
                </label>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-2 bg-slate-900">
                  <img
                    src={afterPhoto}
                    alt="After repair preview"
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    After Repair Proof
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAfterPhoto(SAMPLE_IMAGES.repairedRoad)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-center cursor-pointer border border-slate-200"
                  >
                    Use Verified Bitumen Patch Photo
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Engineering Repair Description & Notes:
                </label>
                <textarea
                  rows={2}
                  value={repairNotes}
                  onChange={(e) => setRepairNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Materials & Equipment Logged:
                </label>
                <input
                  type="text"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-slate-800"
                  required
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
                Upon confirmation, the public map pin will turn <strong>GREEN</strong> and the citizen will receive a completion alert.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingComplaint(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  Verify & Mark Fixed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
