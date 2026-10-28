import type { AnalysisResponse, HealthResponse } from '../types/api';

const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api/v1`;

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Health check failed: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchAnalysis(
  startDate?: string,
  endDate?: string
): Promise<AnalysisResponse> {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const url = `${API_BASE}/analysis${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {
      // ignore json parse error
    }
    throw new Error(detail);
  }
  return res.json();
}
