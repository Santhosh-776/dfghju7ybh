import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TimeseriesPoint } from '../types/api';

interface ComparisonTableProps {
  timeseries: TimeseriesPoint[];
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({ timeseries }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter based on search input
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return timeseries;
    const term = searchTerm.toLowerCase();
    return timeseries.filter((row) => {
      const dt = new Date(row.delivery_time).toISOString().toLowerCase();
      const status = row.status.toLowerCase();
      return dt.includes(term) || status.includes(term);
    });
  }, [timeseries, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageIndex = Math.min(currentPage, totalPages);
  const startIndex = (pageIndex - 1) * pageSize;
  const currentRows = filtered.slice(startIndex, startIndex + pageSize);

  // CSV Export handler
  const handleExportCSV = () => {
    const headers = ['Delivery Time (UTC)', 'Forecast (MW)', 'Actual (MW)', 'Error (MW)', 'Status', 'Forecast Publish Time (UTC)'];
    const rows = filtered.map((row) => [
      row.delivery_time,
      row.forecast_mw !== null ? row.forecast_mw : '',
      row.actual_mw !== null ? row.actual_mw : '',
      row.error_mw !== null ? row.error_mw : '',
      row.status,
      row.forecast_publish_time || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wind_forecast_comparison_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 className="text-base font-semibold text-slate-900 font-display">
            Recent Forecast Comparisons
          </h3>
          <div className="relative inline-flex items-center">
            <Search className="w-4 h-4 absolute left-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by date, time, status..."
              className="bg-slate-50 text-slate-800 pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-200 outline-none placeholder:text-slate-400 w-full sm:w-60 focus:bg-white focus:border-slate-300 transition-colors"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-5">Delivery Time (UTC)</th>
              <th className="py-3 px-5 text-right font-mono">Forecast (MW)</th>
              <th className="py-3 px-5 text-right font-mono">Actual (MW)</th>
              <th className="py-3 px-5 text-right font-mono">Error (MW)</th>
              <th className="py-3 px-5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-sans text-xs">
                  No records match your filter criteria.
                </td>
              </tr>
            ) : (
              currentRows.map((row, idx) => {
                const dt = new Date(row.delivery_time).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'UTC',
                });

                const isOver = row.error_mw !== null && row.error_mw > 0;
                const isUnder = row.error_mw !== null && row.error_mw < 0;

                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    {/* Delivery Time */}
                    <td className="py-3.5 px-5 font-sans font-medium text-slate-900">
                      {dt}
                    </td>

                    {/* Forecast MW */}
                    <td className="py-3.5 px-5 text-right text-slate-700">
                      {row.forecast_mw !== null ? `${row.forecast_mw.toLocaleString()} MW` : '-- MW'}
                    </td>

                    {/* Actual MW */}
                    <td className="py-3.5 px-5 text-right font-semibold text-[#07856B]">
                      {row.actual_mw !== null ? `${row.actual_mw.toLocaleString()} MW` : '-- MW'}
                    </td>

                    {/* Error MW */}
                    <td className="py-3.5 px-5 text-right">
                      {row.error_mw !== null ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${isOver
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : isUnder
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-slate-100 text-slate-700 border-slate-200/60'
                            }`}
                        >
                          {row.error_mw > 0 ? `+${row.error_mw.toLocaleString()}` : row.error_mw.toLocaleString()} MW{' '}
                          {isOver ? '(Overforecast)' : isUnder ? '(Underforecast)' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-- MW</span>
                      )}
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-5 font-sans">
                      {row.status === 'matched' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#07856B] text-[11px] font-medium border border-emerald-200/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#07856B]"></span>
                          Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-medium border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Data Gap
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          Showing{' '}
          <strong className="text-slate-800 font-semibold">
            {filtered.length > 0 ? startIndex + 1 : 0} – {Math.min(startIndex + pageSize, filtered.length)}
          </strong>{' '}
          of {filtered.length} intervals
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={pageIndex <= 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-sm cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-2 font-medium text-slate-700">
            Page {pageIndex} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageIndex >= totalPages}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors shadow-sm cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
