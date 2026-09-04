import { useState, useCallback } from 'react';
import * as api from '../api/client';

export const useCase = () => {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCase = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCase(id);
      setCaseData(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch case');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitCase = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.createCase(data);
      setCaseData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to submit case');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitReport = useCallback(async (caseId, file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.uploadReport(caseId, file);
      // Optimistically update or re-fetch depending on API response structure
      // For now, we assume it just returns success, so we might want to re-fetch
      await fetchCase(caseId);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to upload report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCase]);

  const submitVoice = useCallback(async (caseId, blob) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.uploadVoice(caseId, blob);
      await fetchCase(caseId);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to upload voice');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCase]);

  return {
    caseData,
    loading,
    error,
    fetchCase,
    submitCase,
    submitReport,
    submitVoice
  };
};
