import React from 'react';
import { useAnalysis } from './hooks/useAnalysis';
import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { TimeseriesChart } from './components/TimeseriesChart';
import { ComparisonTable } from './components/ComparisonTable';
import { DataStatusPanel } from './components/DataStatusPanel';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { data, loading, error, startDate, endDate, refresh } = useAnalysis('2026-01-01', '2026-01-31');

  return (
    <div className="w-full min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col font-sans">
      <Header
        startDate={startDate}
        endDate={endDate}
        lastRefreshed={data?.metadata.last_refreshed}
        loading={loading}
        onRefresh={refresh}
      />

      <main className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-start justify-between shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold">Failed to load wind forecast data</h4>
                <p className="text-xs text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={refresh}
              className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Initial Loading Skeleton */}
        {loading && !data && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-white rounded-xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
                  <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-2 bg-slate-100 rounded w-full"></div>
                </div>
              ))}
            </div>
            <div className="h-96 bg-white rounded-xl border border-slate-200 p-6 animate-pulse flex items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#07856B]" />
              <span className="text-sm">Fetching and aligning January 2026 Elexon datasets...</span>
            </div>
          </div>
        )}

        {/* Loaded Dashboard Content */}
        {data && (
          <>
            <KPICards metrics={data.metrics} dataQuality={data.data_quality} />
            <TimeseriesChart data={data.timeseries} />
            <ComparisonTable timeseries={data.timeseries} />
            <DataStatusPanel dataQuality={data.data_quality} lastRefreshed={data.metadata.last_refreshed} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>UK National Grid Wind Power Forecast Evaluation System &bull; January 2026</span>
          <span>Source: Elexon BMRS API (FUELHH & WINDFOR streams)</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
