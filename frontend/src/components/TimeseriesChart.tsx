import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { TimeseriesPoint } from '../types/api';

interface TimeseriesChartProps {
  data: TimeseriesPoint[];
}

export const TimeseriesChart: React.FC<TimeseriesChartProps> = ({ data }) => {
  // Format data for Recharts
  const chartData = useMemo(() => {
    return data.map((point) => {
      const dt = new Date(point.delivery_time);
      const label = dt.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });
      return {
        ...point,
        formattedTime: label,
        shortTime: `${dt.getUTCDate()} ${dt.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`,
      };
    });
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as TimeseriesPoint & { formattedTime: string };
      const forecast = point.forecast_mw !== null ? `${point.forecast_mw.toLocaleString()} MW` : 'Missing';
      const actual = point.actual_mw !== null ? `${point.actual_mw.toLocaleString()} MW` : 'Missing';
      const error = point.error_mw !== null
        ? `${point.error_mw > 0 ? '+' : ''}${point.error_mw.toLocaleString()} MW`
        : 'N/A';

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-xl p-3.5 shadow-xl text-xs space-y-2 min-w-[200px]">
          <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span>{point.formattedTime} UTC</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${point.status === 'matched'
                ? 'bg-emerald-50 text-[#07856B] border border-emerald-200/50'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
              {point.status === 'matched' ? 'Matched' : 'Telemetry Gap'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span className="w-2.5 h-0.5 bg-[#4778D0] inline-block border-t border-dashed border-[#4778D0]"></span>
                Forecast (MW):
              </span>
              <span className="font-mono font-semibold text-slate-800">{forecast}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span className="w-2.5 h-1 bg-[#07856B] inline-block rounded-full"></span>
                Actual (MW):
              </span>
              <span className="font-mono font-bold text-[#07856B]">{actual}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pt-1 border-t border-slate-100">
              <span className="text-slate-400 font-medium">Forecast Error:</span>
              <span className={`font-mono font-semibold ${point.error_mw && point.error_mw > 0 ? 'text-blue-600' : 'text-rose-600'
                }`}>
                {error}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 flex flex-col gap-4">
      {/* Chart Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900 font-display">
            Forecast vs Actual Wind Generation
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            National wind power output in Megawatts (MW) hourly comparison
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-0 border-t-2 border-dashed border-[#4778D0] inline-block"></span>
            <span className="text-slate-700 font-medium">Forecast (MW)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 bg-[#07856B] inline-block rounded-full"></span>
            <span className="text-slate-700 font-medium">Actual Generation (MW)</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F6" vertical={false} />
            <XAxis
              dataKey="shortTime"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              interval="preserveStartEnd"
              dy={10}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k MW`}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="forecast_mw"
              name="Forecast (MW)"
              stroke="#4778D0"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
              activeDot={{ r: 5, stroke: '#4778D0', strokeWidth: 2, fill: '#fff' }}
            />
            <Line
              type="monotone"
              dataKey="actual_mw"
              name="Actual Generation (MW)"
              stroke="#07856B"
              strokeWidth={2.5}
              dot={false}
              connectNulls={false}
              activeDot={{ r: 6, stroke: '#07856B', strokeWidth: 2, fill: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Hourly average generation matched with latest day-ahead forecast before 12:00 UTC cutoff.</span>
        </div>
        <span className="text-slate-400 text-xs">Total: {data.length} hourly intervals</span>
      </div>
    </section>
  );
};
