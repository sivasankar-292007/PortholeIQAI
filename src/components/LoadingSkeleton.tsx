import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

/**
 * Skeleton placeholder for a single complaint item card
 */
export const ComplaintCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Photo thumbnail placeholder */}
        <div className="w-full sm:w-28 h-28 rounded-xl bg-slate-200 shrink-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-slate-300" />
        </div>

        {/* Content Details placeholder */}
        <div className="flex-1 min-w-0 space-y-2.5 w-full">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-5 w-20 bg-slate-200 rounded-lg" />
            <div className="h-5 w-16 bg-slate-200 rounded-lg" />
            <div className="h-5 w-24 bg-slate-200 rounded-lg" />
          </div>

          {/* Title / Location */}
          <div className="h-4 w-3/4 bg-slate-200 rounded" />
          <div className="h-3.5 w-1/2 bg-slate-200 rounded" />

          {/* Subtitle / Reporter */}
          <div className="flex items-center gap-3 pt-1">
            <div className="h-3 w-28 bg-slate-200 rounded" />
            <div className="h-3 w-20 bg-slate-200 rounded" />
          </div>
        </div>

        {/* Action Button placeholder */}
        <div className="sm:self-center shrink-0 w-full sm:w-auto flex sm:flex-col justify-end gap-2 pt-2 sm:pt-0">
          <div className="h-8 w-24 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Group of complaint card skeletons
 */
export const ComplaintListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ComplaintCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton for Engineer Dashboard Work Orders
 */
export const EngineerWorkOrderSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-20 bg-slate-200 rounded-lg" />
            <div className="h-5 w-24 bg-slate-200 rounded-lg" />
          </div>

          <div className="h-32 bg-slate-200 rounded-xl w-full" />

          <div className="space-y-2">
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
            <div className="h-3.5 w-1/2 bg-slate-200 rounded" />
          </div>

          <div className="pt-2 flex gap-2">
            <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
            <div className="h-9 w-24 bg-slate-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for the Top Stats KPI Cards
 */
export const StatsBarSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-3 animate-pulse">
      {[1, 2, 3].map((idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm text-center space-y-2"
        >
          <div className="h-8 sm:h-10 w-16 bg-slate-200 rounded mx-auto" />
          <div className="h-4 w-20 bg-slate-200 rounded mx-auto" />
          <div className="h-3 w-24 bg-slate-100 rounded mx-auto hidden sm:block" />
        </div>
      ))}
    </div>
  );
};

/**
 * Subtle backend sync indicator with live spinning icon
 */
export const BackendSyncBanner: React.FC<{
  isLoading: boolean;
  onRefresh?: () => void;
  message?: string;
}> = ({
  isLoading,
  onRefresh,
  message = 'Syncing data with Render backend API...'
}) => {
  if (!isLoading) return null;

  return (
    <div className="flex items-center justify-between bg-amber-50 border border-amber-200/90 text-amber-900 px-4 py-2.5 rounded-xl text-xs mb-3 shadow-xs transition-all animate-fadeIn">
      <div className="flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
        <span className="font-medium">{message}</span>
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Refreshing</span>
        </button>
      )}
    </div>
  );
};
