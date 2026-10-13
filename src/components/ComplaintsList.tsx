import React, { useState } from 'react';
import { usePothole } from '../context/PotholeContext';
import { Complaint, ComplaintStatus, SeverityLevel } from '../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Wrench
} from 'lucide-react';

interface ComplaintsListProps {
  onSelectComplaint: (complaint: Complaint) => void;
}

export const ComplaintsList: React.FC<ComplaintsListProps> = ({ onSelectComplaint }) => {
  const { complaints, calculateDaysIgnored } = usePothole();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ComplaintStatus>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | SeverityLevel>('All');

  // Filter complaints
  const filtered = complaints.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.reporterName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSeverity = severityFilter === 'All' || c.estimatedSeverity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-4">
      {/* Header & Search */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              All complaints
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Every report displays AI confidence, verified location, and live days-ignored counter.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Total {filtered.length} reports
          </div>
        </div>

        {/* Search bar & filter pills */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID (#PIQ-101) or street name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Fixed / Completed</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as any)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700"
            >
              <option value="All">All Severities</option>
              <option value="Dangerous">Dangerous</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low / Small</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints List Cards matching exact video design */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
            No complaints matching your search filters.
          </div>
        ) : (
          filtered.map((c) => {
            const days = calculateDaysIgnored(c);
            const isFixed = c.status === 'Completed';

            return (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {/* Photo thumbnail matching video */}
                  <div className="relative shrink-0">
                    <img
                      src={c.photoUrl}
                      alt="pothole thumbnail"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-200 bg-slate-900"
                    />
                    {isFixed && (
                      <span className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Complaint details */}
                  <div className="min-w-0 flex-1">
                    {/* ID & Status badges matching video: "#5 pending dangerous" */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {c.id.replace('PIQ-', '#')}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold lowercase ${
                          isFixed
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : c.status === 'Assigned'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isFixed ? 'fixed' : c.status.toLowerCase()}
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
                        {c.estimatedSeverity === 'Dangerous'
                          ? 'dangerous'
                          : c.estimatedSeverity === 'Medium'
                          ? 'medium'
                          : 'small'}
                      </span>
                    </div>

                    {/* AI Confidence & Ignored Counter line matching video: "AI confidence 86% · ignored for 0 days" */}
                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-1.5">
                      <span>AI confidence {(c.aiConfidence * 100).toFixed(0)}%</span>
                      <span>·</span>
                      {isFixed ? (
                        <span className="text-emerald-700 font-semibold">fixed</span>
                      ) : (
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600 inline" />
                          ignored for {days} days
                        </span>
                      )}
                    </div>

                    {/* Street name */}
                    <div className="text-[11px] text-slate-500 truncate mt-1">
                      {c.address}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 text-slate-400 group-hover:text-slate-700 transition-colors">
                  <span className="text-xs font-semibold hidden sm:inline text-amber-600">
                    View
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
