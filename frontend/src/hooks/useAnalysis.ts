import { useCallback, useEffect, useState } from 'react';
import { fetchAnalysis } from '../api/client';
import type { AnalysisResponse } from '../types/api';

export function useAnalysis(
  initialStartDate: string = '2026-01-01',
  initialEndDate: string = '2026-01-31'
) {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(initialStartDate);
  const [endDate, setEndDate] = useState<string>(initialEndDate);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAnalysis(startDate, endDate);
      setData(res);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch wind forecast analysis');
      }
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  return {
    data,
    loading,
    error,
    startDate,
    endDate,
    setDateRange,
    refresh: loadData,
  };
}
