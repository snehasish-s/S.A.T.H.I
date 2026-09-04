import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as api from '../api/client';

const ConsentModal = ({ onComplete }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAccept = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await api.recordConsent({ consent_given: true, timestamp: new Date().toISOString() });
      localStorage.setItem('consentGiven', 'true');
      onComplete(true);
    } catch (error) {
      console.error(error);
      // Even if API fails, for prototype we might just let them through
      localStorage.setItem('consentGiven', 'true');
      onComplete(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    setErrorMsg(t('cannot_collect'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md border-t-4 border-sahayak-teal flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('consent_title')}</h2>
          
          <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded mb-4">
            {t('disclaimer')}
          </div>

          <p className="text-gray-700 mb-6 text-sm">
            {t('consent_body')}
          </p>

          {errorMsg && (
            <div className="mb-4 text-safety-red text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={handleDecline}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              {t('decline')}
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-sahayak-teal hover:bg-sahayak-dark rounded disabled:opacity-50"
            >
              {loading ? t('loading') : t('accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
