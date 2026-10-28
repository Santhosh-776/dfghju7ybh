import React from 'react';
import { Wind, Calendar, Clock, RefreshCw } from 'lucide-react';

interface HeaderProps {
  startDate: string;
  endDate: string;
  lastRefreshed?: string;
  loading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  startDate,
  endDate,
  lastRefreshed,
  loading,
  onRefresh,
}) => {
  const formattedRefreshTime = lastRefreshed
    ? new Date(lastRefreshed).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }) + ' UTC'
    : 'Connecting...';

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#07856B] flex items-center justify-center border border-emerald-200/60 shadow-sm flex-shrink-0">
            <Wind className="w-5 h-5 text-[#07856B]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display font-bold text-lg text-slate-900 tracking-tight leading-none">
                Wind Forecast Dashboard
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                UK National Grid
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-1">
              Compare day-ahead forecast wind power against actual generation across Great Britain
            </p>
          </div>
        </div>

        {/* Controls & Badges */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Active Period */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{startDate} to {endDate}</span>
          </div>

          {/* Cutoff Assumption Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Forecast Cutoff: Day-Ahead 12:00 PM UTC</span>
          </div>

          {/* Sync Status */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 px-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Refreshed: {formattedRefreshTime}</span>
          </div>

          {/* Refresh Action Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
