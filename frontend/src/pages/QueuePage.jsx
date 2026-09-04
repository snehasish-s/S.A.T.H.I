import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import * as api from '../api/client';

const QueuePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [facility, setFacility] = useState('');

  const fetchQueue = async () => {
    try {
      const data = await api.getQueue(facility || undefined);
      setQueue(data);
      setError(null);
    } catch (err) {
      setError('Failed to load queue data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [facility]);

  const stats = {
    RED: queue.filter(c => c.risk_tag === 'RED').length,
    AMBER: queue.filter(c => c.risk_tag === 'AMBER').length,
    GREEN: queue.filter(c => c.risk_tag === 'GREEN').length,
  };

  const getWaitTimeBorder = (minutes) => {
    if (minutes > 60) return 'border-l-4 border-l-safety-red';
    if (minutes > 30) return 'border-l-4 border-l-safety-amber';
    return 'border-l-4 border-l-sahayak-teal';
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('priority_queue')}</h1>
        
        <div className="flex items-center gap-4">
          <select 
            value={facility} 
            onChange={(e) => setFacility(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm text-sm focus:ring-sahayak-teal focus:border-sahayak-teal"
          >
            <option value="">All Facilities</option>
            <option value="General Hospital">General Hospital</option>
            <option value="City Clinic">City Clinic</option>
          </select>
          <button 
            onClick={fetchQueue}
            className="p-2 text-gray-500 hover:text-sahayak-teal bg-white rounded shadow-sm border border-gray-200"
            title="Refresh"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-3xl font-bold text-safety-red">{stats.RED}</span>
          <span className="text-sm text-gray-500 font-medium">RED (Emergency)</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-3xl font-bold text-safety-amber">{stats.AMBER}</span>
          <span className="text-sm text-gray-500 font-medium">AMBER (Urgent)</span>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-3xl font-bold text-safety-green">{stats.GREEN}</span>
          <span className="text-sm text-gray-500 font-medium">GREEN (Standard)</span>
        </div>
      </div>

      {loading && <div className="text-center py-8">{t('loading')}</div>}
      {error && <div className="text-center py-8 text-safety-red">{error}</div>}

      {!loading && queue.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100 text-gray-500">
          {t('no_cases')}
        </div>
      )}

      <div className="space-y-3">
        {queue.map(caseItem => (
          <div 
            key={caseItem.id} 
            onClick={() => navigate(`/dashboard?case_id=${caseItem.id}`)}
            className={`bg-white p-4 rounded-lg shadow-sm border-t border-r border-b border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between ${getWaitTimeBorder(caseItem.wait_time_minutes)}`}
          >
            <div className="flex items-center gap-6">
              <RiskBadge tag={caseItem.risk_tag} size="sm" />
              <div>
                <h3 className="font-mono font-medium text-gray-900">{caseItem.pseudonymous_id}</h3>
                <p className="text-sm text-gray-500 truncate max-w-xs">{caseItem.patient_data?.symptoms || 'No symptoms text'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-right">
              <div className="hidden md:block text-sm text-gray-500">
                {caseItem.facility}
              </div>
              <div className="flex flex-col">
                <span className={`text-sm font-bold ${caseItem.wait_time_minutes > 30 ? 'text-safety-amber' : 'text-gray-700'} ${caseItem.wait_time_minutes > 60 ? 'text-safety-red' : ''}`}>
                  {caseItem.wait_time_minutes} min
                </span>
                <span className="text-xs text-gray-400">Waiting</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QueuePage;
