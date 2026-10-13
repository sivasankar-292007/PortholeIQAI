import React from 'react';
import { usePothole } from '../context/PotholeContext';
import { Clock, CheckCircle2, AlertTriangle, Cpu, Sliders } from 'lucide-react';
import { StatsBarSkeleton } from './LoadingSkeleton';

export const StatsBar: React.FC = () => {
  const { complaints, calculateDaysIgnored, aiThreshold, setAiThreshold, isLoadingBackend } = usePothole();

  const pendingComplaints = complaints.filter((c) => c.status === 'Pending');
  const assignedComplaints = complaints.filter((c) => c.status === 'Assigned');
  const inProgressComplaints = complaints.filter((c) => c.status === 'In Progress');
  const fixedComplaints = complaints.filter((c) => c.status === 'Completed');

  // Calculate dynamic average days ignored across all open complaints
  const openComplaints = complaints.filter((c) => c.status !== 'Completed' && c.status !== 'Rejected');
  const totalDaysIgnored = openComplaints.reduce((acc, c) => acc + calculateDaysIgnored(c), 0);
  const avgDaysIgnored = openComplaints.length > 0 ? Math.round(totalDaysIgnored / openComplaints.length) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
      {/* 3 Main KPI Cards or Skeleton while loading */}
      {isLoadingBackend && complaints.length === 0 ? (
        <StatsBarSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-3">
        {/* Pending Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm text-center">
          <div className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {pendingComplaints.length}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-rose-600 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            Pending
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
            Awaiting inspection
          </div>
        </div>

        {/* Fixed / Completed Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm text-center">
          <div className="text-2xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight">
            {fixedComplaints.length}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-emerald-700 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            Fixed
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
            Repaired & verified
          </div>
        </div>

        {/* Avg Days Ignored Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm text-center">
          <div className="text-2xl sm:text-4xl font-extrabold text-amber-600 tracking-tight">
            {avgDaysIgnored}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-700 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Avg days ignored
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
            Live dynamic elapsed
          </div>
        </div>
      </div>
      )}

      {/* Banner matching the video demo note with interactive threshold slider */}
      <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-950">AI Inference Active:</strong> 224×224 MobileNetV2 edge pipeline loaded. Potholes are classified and normal road photos are rejected.
          </span>
        </div>

        {/* Interactive Threshold Control (as required in prompt section 4) */}
        <div className="flex items-center gap-2 bg-white/80 px-2.5 py-1 rounded-lg border border-amber-200 text-xs">
          <Sliders className="w-3.5 h-3.5 text-amber-700" />
          <span className="font-medium text-slate-700">Threshold:</span>
          <span className="font-mono font-bold text-slate-900">
            {(aiThreshold * 100).toFixed(0)}%
          </span>
          <input
            type="range"
            min="0.30"
            max="0.80"
            step="0.05"
            value={aiThreshold}
            onChange={(e) => setAiThreshold(parseFloat(e.target.value))}
            className="w-16 accent-amber-600 cursor-pointer"
            title="Adjust AI classification threshold"
          />
        </div>
      </div>
    </div>
  );
};
