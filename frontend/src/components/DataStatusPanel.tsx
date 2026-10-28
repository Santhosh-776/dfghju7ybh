import React from 'react';
import { CheckCircle2, AlertTriangle, Database } from 'lucide-react';
import type { DataQualityModel } from '../types/api';

interface DataStatusPanelProps {
  dataQuality: DataQualityModel;
  lastRefreshed?: string;
}

export const DataStatusPanel: React.FC<DataStatusPanelProps> = ({
  dataQuality,
  lastRefreshed,
}) => {
  const missingTotal =
    dataQuality.missing_forecast + dataQuality.missing_actual + dataQuality.unmatched;

  const coveragePercent =
    dataQuality.total_intervals > 0
      ? ((dataQuality.matched_intervals / dataQuality.total_intervals) * 100).toFixed(1)
      : '0.0';

  const formattedRefreshTime = lastRefreshed
    ? new Date(lastRefreshed).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    }) + ' UTC'
    : 'Pending sync';

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 sm:p-6 flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#07856B]" />
          <h3 className="text-base font-semibold text-slate-900 font-display">
            Data Quality & Pipeline Health
          </h3>
        </div>
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          All systems operational
        </span>
      </div>

      {/* Grid of 3 Quality Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Matched Records */}
        <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-200/60 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Matched Records</span>
          <div className="my-1.5">
            <span className="text-xl font-bold font-mono text-slate-900">
              {dataQuality.matched_intervals.toLocaleString()} intervals
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#07856B] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#07856B]"></span>
            <span>{coveragePercent}% temporal coverage</span>
          </div>
        </div>

        {/* Missing / Gaps */}
        <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-200/60 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Telemetry Gaps / Missing</span>
          <div className="my-1.5">
            <span className={`text-xl font-bold font-mono ${missingTotal > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {missingTotal.toLocaleString()} intervals
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            {missingTotal > 0 ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {dataQuality.missing_forecast > 0 ? `${dataQuality.missing_forecast} missing forecast ` : ''}
                  {dataQuality.missing_actual > 0 ? `${dataQuality.missing_actual} missing actual` : ''}
                </span>
              </>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete coverage
              </span>
            )}
          </div>
        </div>

        {/* Stream Status & Sync Time */}
        <div className="bg-slate-50/70 rounded-lg p-4 border border-slate-200/60 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500">Last Synced (UTC)</span>
          <div className="my-1.5">
            <span className="text-base font-bold font-mono text-slate-800">
              {formattedRefreshTime}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Elexon BMRS (FUELHH + WINDFOR)</span>
          </div>
        </div>
      </div>
    </section>
  );
};
