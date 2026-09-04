import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import { useCase } from '../hooks/useCase';
import * as api from '../api/client';

const ReviewerDashboard = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const caseId = searchParams.get('case_id');
  
  const { fetchCase, caseData, loading, error } = useCase();
  const [auditTrail, setAuditTrail] = useState([]);
  const [actionNotes, setActionNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideTag, setOverrideTag] = useState('GREEN');

  // Check login
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (caseId) {
      fetchCase(caseId);
      api.getAuditTrail(caseId).then(setAuditTrail).catch(console.error);
    }
  }, [caseId, fetchCase]);

  if (!caseId) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl mb-4">Please select a case from the queue</h2>
        <button 
          onClick={() => navigate('/queue')}
          className="px-4 py-2 bg-sahayak-teal text-white rounded"
        >
          Go to Queue
        </button>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">{t('loading')}</div>;
  if (error) return <div className="p-8 text-center text-safety-red">{error}</div>;
  if (!caseData) return null;

  const handleAction = async (actionType) => {
    try {
      const payload = {
        reviewer_id: 'reviewer_1', // Mock
        action: actionType,
        notes: actionNotes,
      };
      if (actionType === 'OVERRIDE') {
        payload.overridden_tag = overrideTag;
      }
      
      await api.reviewCase(caseId, payload);
      alert('Action recorded successfully');
      fetchCase(caseId);
      api.getAuditTrail(caseId).then(setAuditTrail);
      setIsEditing(false);
      setIsOverriding(false);
      setActionNotes('');
    } catch (err) {
      alert('Failed to record action');
      console.error(err);
    }
  };

  const handleReferral = async () => {
    try {
      await api.createReferral(caseId, {
        referred_to: 'Specialist Dept',
        reason: actionNotes || 'Requires further evaluation'
      });
      alert('Referral generated');
      api.getAuditTrail(caseId).then(setAuditTrail);
    } catch (err) {
      alert('Failed to generate referral');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left Column: Case details & Evidence */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div>
            <h1 className="text-xl font-bold font-mono">{caseData.pseudonymous_id}</h1>
            <p className="text-sm text-gray-500">Status: <span className="font-semibold text-gray-800">{caseData.status}</span></p>
          </div>
          <RiskBadge 
            tag={caseData.risk_tag} 
            message={caseData.evidence?.rule_message} 
            size="lg" 
          />
        </div>

        {/* AI Advisory Card */}
        {caseData.llm_summary && (
          <div className="bg-teal-50 border-l-4 border-sahayak-teal p-4 rounded-r-lg shadow-sm">
            <div className="flex items-center gap-2 text-sahayak-dark font-bold mb-2 text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              AI Advisory Summary
            </div>
            <p className="text-sm text-gray-800">{caseData.llm_summary}</p>
          </div>
        )}

        {/* Patient Data */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">{t('case_details')}</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div><span className="text-gray-500">Age:</span> {caseData.patient_data?.age || 'N/A'}</div>
            <div><span className="text-gray-500">Gender:</span> {caseData.patient_data?.gender || 'N/A'}</div>
            <div className="col-span-2">
              <span className="text-gray-500 block mb-1">Symptoms:</span> 
              <p className="bg-gray-50 p-3 rounded">{caseData.patient_data?.symptoms || 'None recorded'}</p>
            </div>
            {caseData.patient_data?.body_parts?.length > 0 && (
              <div className="col-span-2">
                <span className="text-gray-500 block mb-1">Body Parts:</span>
                <div className="flex gap-2">
                  {caseData.patient_data.body_parts.map(bp => (
                    <span key={bp} className="bg-gray-200 px-2 py-1 rounded text-xs">{bp}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Actions & Audit */}
      <div className="space-y-6">
        
        {/* Actions Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">Review Actions</h2>
          
          <div className="space-y-3">
            {!isEditing && !isOverriding ? (
              <>
                <button onClick={() => handleAction('ACCEPT')} className="w-full py-2 bg-sahayak-teal text-white rounded font-medium hover:bg-sahayak-dark">
                  Accept AI Suggestion
                </button>
                <button onClick={() => setIsEditing(true)} className="w-full py-2 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200">
                  Edit Notes & Accept
                </button>
                <button onClick={() => setIsOverriding(true)} className="w-full py-2 bg-white border border-safety-red text-safety-red rounded font-medium hover:bg-red-50">
                  Override Tag
                </button>
                <button onClick={() => {setIsEditing(true); handleReferral()}} className="w-full py-2 mt-4 bg-gray-800 text-white rounded font-medium hover:bg-black">
                  Generate Referral
                </button>
              </>
            ) : (
              <div className="animate-fade-in space-y-4">
                {isOverriding && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Tag</label>
                    <select 
                      value={overrideTag} 
                      onChange={(e) => setOverrideTag(e.target.value)}
                      className="w-full border-gray-300 rounded p-2 border"
                    >
                      <option value="RED">RED</option>
                      <option value="AMBER">AMBER</option>
                      <option value="GREEN">GREEN</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes</label>
                  <textarea 
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full border-gray-300 rounded p-2 border"
                    rows="3"
                    placeholder="Enter reasoning..."
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAction(isOverriding ? 'OVERRIDE' : 'ACCEPT')} className="flex-1 py-2 bg-sahayak-teal text-white rounded font-medium">
                    Submit
                  </button>
                  <button onClick={() => {setIsEditing(false); setIsOverriding(false);}} className="flex-1 py-2 bg-gray-200 text-gray-800 rounded font-medium">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">{t('audit_trail')}</h2>
          <div className="space-y-4 text-sm relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {auditTrail.map((log, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-slate-300 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                  <div className="w-1.5 h-1.5 bg-sahayak-teal rounded-full"></div>
                </div>
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded border border-gray-100 shadow-sm ml-2 md:ml-0">
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-gray-800">{log.action}</span>
                    <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {log.notes && <p className="text-gray-600 text-xs italic">"{log.notes}"</p>}
                </div>
              </div>
            ))}
            {auditTrail.length === 0 && <p className="text-gray-500 text-center">No history yet</p>}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default ReviewerDashboard;
