export type IntervalStatus = 'matched' | 'missing_forecast' | 'missing_actual' | 'unmatched';

export interface TimeseriesPoint {
  delivery_time: string;
  forecast_mw: number | null;
  actual_mw: number | null;
  error_mw: number | null;
  forecast_publish_time: string | null;
  status: IntervalStatus;
}

export interface MetricsModel {
  mae_mw: number;
  rmse_mw: number;
  mbe_mw: number;
  n_observations: number;
  avg_actual_mw: number;
}

export interface DataQualityModel {
  total_intervals: number;
  matched_intervals: number;
  missing_forecast: number;
  missing_actual: number;
  unmatched: number;
}

export interface AnalysisMetadata {
  period_start: string;
  period_end: string;
  last_refreshed: string;
}

export interface AnalysisResponse {
  metadata: AnalysisMetadata;
  metrics: MetricsModel;
  timeseries: TimeseriesPoint[];
  data_quality: DataQualityModel;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}
