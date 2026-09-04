import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ConsentModal from '../components/ConsentModal';
import BodyMap from '../components/BodyMap';
import ReportUploader from '../components/ReportUploader';
import VoiceRecorder from '../components/VoiceRecorder';
import RiskBadge from '../components/RiskBadge';
import { useCase } from '../hooks/useCase';
import { useNavigate } from 'react-router-dom';

const IntakePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { submitCase, loading, caseData } = useCase();
  
  const [step, setStep] = useState(1);
  const [consentGiven, setConsentGiven] = useState(localStorage.getItem('consentGiven') === 'true');
  const [formData, setFormData] = useState({
    patient_name: '',
    phone: '',
    age: '',
    gender: '',
    facility: '',
    symptoms: '',
    fever_duration_days: '',
    symptom_duration_hours: '',
    symptom_count: ''
  });
  const [selectedBodyParts, setSelectedBodyParts] = useState([]);
  const [symptomTab, setSymptomTab] = useState('text'); // text, body, voice
  const [submittedCaseId, setSubmittedCaseId] = useState(null);

  useEffect(() => {
    if (!consentGiven) setStep(1);
    else if (step === 1) setStep(2);
  }, [consentGiven, step]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBodyToggle = (part) => {
    setSelectedBodyParts(prev => 
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  const handleCreateCase = async () => {
    try {
      const payload = {
        ...formData,
        body_parts: selectedBodyParts,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        fever_duration_days: formData.fever_duration_days ? parseInt(formData.fever_duration_days, 10) : undefined,
        symptom_duration_hours: formData.symptom_duration_hours ? parseInt(formData.symptom_duration_hours, 10) : undefined,
        symptom_count: formData.symptom_count ? parseInt(formData.symptom_count, 10) : undefined,
      };
      
      const res = await submitCase(payload);
      setSubmittedCaseId(res.id);
      setStep(5); // Move to results step
    } catch (err) {
      console.error(err);
      alert('Failed to submit case.');
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 2));

  if (!consentGiven) {
    return <ConsentModal onComplete={() => setConsentGiven(true)} />;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Progress Bar */}
        <div className="bg-gray-100 flex h-2 w-full">
          {[2, 3, 4, 5].map((s) => (
            <div 
              key={s} 
              className={`flex-1 ${s <= step ? 'bg-sahayak-teal' : 'bg-gray-200'} transition-all duration-300 ${s > 2 ? 'border-l border-white' : ''}`}
            />
          ))}
        </div>

        <div className="p-6">
          {/* Step 2: Demographics */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-4">Patient Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('patient_name')}</label>
                  <input type="text" name="patient_name" value={formData.patient_name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sahayak-teal focus:ring focus:ring-sahayak-teal focus:ring-opacity-50 p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('phone')}</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sahayak-teal focus:ring focus:ring-sahayak-teal focus:ring-opacity-50 p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('age')}</label>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sahayak-teal focus:ring focus:ring-sahayak-teal focus:ring-opacity-50 p-2 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">{t('gender')}</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sahayak-teal focus:ring focus:ring-sahayak-teal focus:ring-opacity-50 p-2 border bg-white">
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">{t('facility')}</label>
                  <input type="text" name="facility" value={formData.facility} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sahayak-teal focus:ring focus:ring-sahayak-teal focus:ring-opacity-50 p-2 border" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Symptoms */}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-bold mb-4">{t('symptoms')}</h2>
              
              <div className="border-b border-gray-200 mb-4 flex gap-4">
                <button 
                  className={`pb-2 px-1 text-sm font-medium ${symptomTab === 'text' ? 'border-b-2 border-sahayak-teal text-sahayak-teal' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setSymptomTab('text')}
                >Text</button>
                <button 
                  className={`pb-2 px-1 text-sm font-medium ${symptomTab === 'body' ? 'border-b-2 border-sahayak-teal text-sahayak-teal' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setSymptomTab('body')}
                >Body Map</button>
                <button 
                  className={`pb-2 px-1 text-sm font-medium ${symptomTab === 'voice' ? 'border-b-2 border-sahayak-teal text-sahayak-teal' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setSymptomTab('voice')}
                >Voice</button>
              </div>

              {symptomTab === 'text' && (
                <div className="space-y-4">
                  <textarea 
                    name="symptoms" 
                    rows="4" 
                    value={formData.symptoms} 
                    onChange={handleChange} 
                    placeholder="Describe symptoms..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sahayak-teal focus:ring focus:ring-sahayak-teal focus:ring-opacity-50 p-3 border" 
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('fever_duration_days')}</label>
                      <input type="number" name="fever_duration_days" value={formData.fever_duration_days} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('symptom_duration_hours')}</label>
                      <input type="number" name="symptom_duration_hours" value={formData.symptom_duration_hours} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">{t('symptom_count')}</label>
                      <input type="number" name="symptom_count" value={formData.symptom_count} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    </div>
                  </div>
                </div>
              )}

              {symptomTab === 'body' && (
                <div className="flex justify-center">
                  <BodyMap selectedParts={selectedBodyParts} onToggle={handleBodyToggle} />
                </div>
              )}

              {symptomTab === 'voice' && (
                <div className="text-center p-4">
                  <p className="mb-4 text-gray-600 text-sm">Please submit the case first to upload voice notes in this prototype.</p>
                  <p className="text-xs text-gray-400">(Voice upload is bound to case ID)</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Reports (Optional) */}
          {step === 4 && (
            <div className="animate-fade-in text-center">
               <h2 className="text-xl font-bold mb-4">Upload Reports (Optional)</h2>
               <p className="mb-4 text-gray-600 text-sm">Submit the case first to attach reports in this prototype flow.</p>
            </div>
          )}

          {/* Step 5: Results / Post-Submit */}
          {step === 5 && caseData && (
            <div className="animate-fade-in text-center flex flex-col items-center">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Triage Result</h2>
              
              <div className="mb-8 p-6 bg-gray-50 rounded-lg w-full max-w-sm">
                <RiskBadge 
                  tag={caseData.risk_tag} 
                  message={caseData.evidence?.rule_message || 'Assessed by system'} 
                  size="lg" 
                />
              </div>

              <div className="flex flex-col gap-3 w-full max-w-sm">
                <button 
                  onClick={() => navigate('/while-you-wait')}
                  className="w-full py-3 bg-sahayak-teal text-white rounded-lg font-medium hover:bg-sahayak-dark"
                >
                  {t('while_you_wait')}
                </button>
                <button 
                  onClick={() => {
                    setStep(2);
                    setFormData({ patient_name: '', phone: '', age: '', gender: '', facility: '', symptoms: '', fever_duration_days: '', symptom_duration_hours: '', symptom_count: '' });
                    setSelectedBodyParts([]);
                    setSubmittedCaseId(null);
                  }}
                  className="w-full py-3 bg-white text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                >
                  New Case
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 5 && (
            <div className="mt-8 flex justify-between pt-4 border-t border-gray-100">
              <button
                onClick={prevStep}
                disabled={step === 2}
                className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {t('back')}
              </button>
              
              {step < 4 ? (
                <button
                  onClick={nextStep}
                  className="px-6 py-2 bg-sahayak-teal text-white rounded-md hover:bg-sahayak-dark"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleCreateCase}
                  disabled={loading}
                  className="px-6 py-2 bg-sahayak-teal text-white rounded-md hover:bg-sahayak-dark font-medium shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  {t('submit')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntakePage;
