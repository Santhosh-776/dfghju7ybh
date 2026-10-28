import React from 'react';
import { LineChart, Zap, CheckCircle2, TrendingUp, TrendingDown, Target } from 'lucide-react';
import type { MetricsModel, DataQualityModel } from '../types/api';

interface KPICardsProps {
  metrics: MetricsModel;
  dataQuality: DataQualityModel;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics, dataQuality }) => {
  const coveragePercent = dataQuality.total_intervals > 0
    ? ((dataQuality.matched_intervals / dataQuality.total_intervals) * 100).toFixed(1)
    : '0.0';

  const isOverforecast = metrics.mbe_mw > 0;

  return (
    <div className="space-y-4">
      {/* Primary 3 KPI Grid matching Stitch Design */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* MAE Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Average Forecast Error (MAE)
            </span>
            <LineChart className="w-4 h-4 text-slate-400" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-display font-bold tracking-tight text-slate-900 font-mono">
                {metrics.mae_mw.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-sm font-semibold text-slate-400">MW</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed pt-3 border-t border-slate-100">
            Typical difference between predicted and actual wind power
          </p>
        </div>

        {/* Average Actual Wind Generation Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Average Actual Wind Generation
            </span>
            <Zap className="w-4 h-4 text-[#07856B]" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-display font-bold tracking-tight text-[#07856B] font-mono">
                {metrics.avg_actual_mw.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-sm font-semibold text-slate-400">MW</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed pt-3 border-t border-slate-100">
            Average national hourly wind output during period
          </p>
        </div>

        {/* Intervals Compared Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Number of Intervals Compared
            </span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-display font-bold tracking-tight text-slate-900 font-mono">
                {metrics.n_observations.toLocaleString()}
              </span>
              <span className="text-sm font-semibold text-slate-400">intervals</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed pt-3 border-t border-slate-100">
            Out of {dataQuality.total_intervals.toLocaleString()} total periods evaluated ({coveragePercent}% coverage)
          </p>
        </div>
      </section>

      {/* Secondary Metrics Bar (RMSE & Bias MBE) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* RMSE */}
        <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-500">
              <Target className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Root Mean Squared Error (RMSE)
              </div>
              <div className="text-xs text-slate-500">Penalises large peak forecast deviations</div>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-base font-bold text-slate-800">
              {metrics.rmse_mw.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">MW</span>
          </div>
        </div>

        {/* Mean Bias Error */}
        <div className="bg-slate-50/80 rounded-lg p-3.5 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center ${isOverforecast ? 'text-blue-600' : 'text-amber-600'}`}>
              {isOverforecast ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Mean Bias Error (MBE)
              </div>
              <div className="text-xs text-slate-500">
                {isOverforecast ? 'Net tendency to overforecast power' : 'Net tendency to underforecast power'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`font-mono text-base font-bold ${isOverforecast ? 'text-blue-700' : 'text-amber-700'}`}>
              {metrics.mbe_mw > 0 ? `+${metrics.mbe_mw.toFixed(1)}` : metrics.mbe_mw.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1">MW</span>
          </div>
        </div>
      </section>
    </div>
  );
};
