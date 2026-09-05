import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Stethoscope,
  HeartPulse,
  Mic,
  Camera,
  Layers,
  FileText,
  User,
  Phone,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Activity,
} from 'lucide-react';
import ConsentModal from '../components/ConsentModal';
import BodyMap from '../components/BodyMap';
import ReportUploader from '../components/ReportUploader';
import VoiceRecorder from '../components/VoiceRecorder';
import RiskBadge from '../components/RiskBadge';
import { createCase, uploadReport, uploadVoice } from '../api/client';

export default function IntakePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [consentGiven, setConsentGiven] = useState(
    localStorage.getItem('sahayak_consent') === 'true'
  );
  
  const [step, setStep] = useState(1); // 1: Demographics, 2: Symptoms (Text/BodyMap/Voice), 3: Lab Reports, 4: Results
  const [symptomTab, setSymptomTab] = useState('text'); // 'text', 'bodymap', 'voice'

  // Form State
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [facility, setFacility] = useState('PHC-Chandrasekharpur');
  const [abhaId, setAbhaId] = useState('');

  // Clinical Symptoms
  const [symptomsText, setSymptomsText] = useState('');
  const [selectedBodyParts, setSelectedBodyParts] = useState([]);
  const [feverDays, setFeverDays] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [symptomCount, setSymptomCount] = useState(1);
  const [chestPainMin, setChestPainMin] = useState('');
  const [spo2Percent, setSpo2Percent] = useState('');
  const [bpSystolic, setBpSystolic] = useState('');
  const [maternalBleeding, setMaternalBleeding] = useState(false);
  const [priorCondition, setPriorCondition] = useState(false);

  // Files
  const [reportFile, setReportFile] = useState(null);
  const [voiceBlob, setVoiceBlob] = useState(null);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [resultCase, setResultCase] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBodyToggle = (partId) => {
    setSelectedBodyParts((prev) =>
      prev.includes(partId) ? prev.filter((p) => p !== partId) : [...prev, partId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Build Payload for Case Creation
      const payload = {
        patient_name: patientName || 'Anonymous Citizen',
        patient_phone: phone || undefined,
        abha_id: abhaId || undefined,
        facility_id: facility || 'PHC-Default',
        symptoms: {
          symptoms_text: symptomsText || (selectedBodyParts.length > 0 ? `Pain in ${selectedBodyParts.join(', ')}` : 'General health check'),
          body_map_selections: selectedBodyParts,
          age_years: age ? parseInt(age, 10) : undefined,
          gender: gender || 'Unknown',
          fever_duration_days: feverDays ? parseFloat(feverDays) : undefined,
          symptom_duration_hours: durationHours ? parseFloat(durationHours) : undefined,
          symptom_count: parseInt(symptomCount, 10) || 1,
          chest_pain_minutes: chestPainMin ? parseFloat(chestPainMin) : undefined,
          spo2_percent: spo2Percent ? parseFloat(spo2Percent) : undefined,
          bp_systolic: bpSystolic ? parseFloat(bpSystolic) : undefined,
          maternal_bleeding: maternalBleeding ? 1 : 0,
          prior_condition_flag: priorCondition ? 1 : 0,
          language: localStorage.getItem('sahayak_lang') || 'en',
        },
      };

      const res = await createCase(payload);
      const createdCase = res.data;

      // 2. Upload Lab Report if provided (Triggers backend OCR)
      if (reportFile && createdCase?.id) {
        try {
          const reportRes = await uploadReport(createdCase.id, reportFile);
          if (reportRes.data) {
            setResultCase(reportRes.data);
          }
        } catch (e) {
          console.warn('Report upload failed, case created', e);
        }
      }

      // 3. Upload Voice Note if recorded (Triggers backend STT)
      if (voiceBlob && createdCase?.id) {
        try {
          const voiceRes = await uploadVoice(createdCase.id, voiceBlob);
          if (voiceRes.data) {
            setResultCase(voiceRes.data);
          }
        } catch (e) {
          console.warn('Voice upload failed, case created', e);
        }
      }

      setResultCase((prev) => prev || createdCase);
      setStep(4); // Move to Result screen
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit triage case. Please check values.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setResultCase(null);
    setSymptomsText('');
    setSelectedBodyParts([]);
    setReportFile(null);
    setVoiceBlob(null);
    setFeverDays('');
    setDurationHours('');
    setChestPainMin('');
    setSpo2Percent('');
    setBpSystolic('');
  };

  if (!consentGiven) {
    return (
      <ConsentModal
        onComplete={() => {
          localStorage.setItem('sahayak_consent', 'true');
          setConsentGiven(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header Ribbon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 mb-2">
            <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
            <span>{t('start_triage', 'Direct Patient Triage Intake')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t('app_title', 'SAHAYAK-Triage')} • {t('symptoms', 'Symptom Entry')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('start_triage_sub', 'No account required — fast, confidential, safety-first triage')}
          </p>
        </div>

        {/* Multi-Step Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Step Stepper Header */}
          <div className="bg-slate-900 text-white p-4">
            <div className="flex items-center justify-between max-w-md mx-auto">
              {[
                { s: 1, label: 'Demographics' },
                { s: 2, label: 'Symptoms' },
                { s: 3, label: 'Reports' },
                { s: 4, label: 'Result' },
              ].map((item) => (
                <div key={item.s} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                      step >= item.s
                        ? 'bg-india-saffron text-slate-900 shadow-md font-extrabold scale-105'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.s}
                  </div>
                  <span
                    className={`text-xs hidden sm:inline ${
                      step >= item.s ? 'text-white font-bold' : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 1: PATIENT DEMOGRAPHICS */}
            {/* ========================================================================= */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-700" />
                    <span>Patient Information (Optional / Synthetic)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct personal identifiers are separated from clinical records under privacy isolation.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('patient_name', 'Patient Name')}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('phone', 'Mobile Number')}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('age', 'Age (Years)')}
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 32"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('gender', 'Gender')}
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 outline-none bg-white"
                    >
                      <option value="Male">Male (पुरुष)</option>
                      <option value="Female">Female (महिला)</option>
                      <option value="Other">Other (अन्य)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t('facility', 'Facility / PHC Location')}
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={facility}
                        onChange={(e) => setFacility(e.target.value)}
                        placeholder="e.g. PHC-Chandrasekharpur"
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-700 hover:bg-teal-800 shadow flex items-center gap-1.5 transition"
                  >
                    <span>Proceed to Symptoms</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 2: MULTIMODAL SYMPTOMS (TEXT / BODY MAP / VOICE) */}
            {/* ========================================================================= */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                {/* Multimodal Tabs */}
                <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSymptomTab('text')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      symptomTab === 'text'
                        ? 'bg-white text-teal-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-600" />
                    <span>Type Text (लेख)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSymptomTab('bodymap')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      symptomTab === 'bodymap'
                        ? 'bg-white text-teal-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    <span>Body Map (अंग चुनें)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSymptomTab('voice')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      symptomTab === 'voice'
                        ? 'bg-white text-teal-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5 text-teal-600" />
                    <span>Voice Audio (आवाज़)</span>
                  </button>
                </div>

                {/* TAB 1: TEXT ENTRY */}
                {symptomTab === 'text' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      {t('symptoms', 'Describe your symptoms in English, Hindi, or Odia')}
                    </label>
                    <textarea
                      rows={3}
                      value={symptomsText}
                      onChange={(e) => setSymptomsText(e.target.value)}
                      placeholder="e.g. Severe chest pain for 40 minutes, difficulty breathing, high fever since yesterday (सीने में तेज दर्द, सांस लेने में तकलीफ...)"
                      className="w-full p-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-600 outline-none"
                    />
                  </div>
                )}

                {/* TAB 2: INTERACTIVE BODY MAP */}
                {symptomTab === 'bodymap' && (
                  <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-xs text-slate-600 mb-2 font-medium">
                      {t('select_area', 'Tap on affected regions (Multi-select enabled)')}
                    </p>
                    <BodyMap selectedParts={selectedBodyParts} onToggle={handleBodyToggle} />
                    {selectedBodyParts.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                        {selectedBodyParts.map((p) => (
                          <span
                            key={p}
                            className="px-2.5 py-1 rounded-full bg-teal-700 text-white text-[11px] font-bold"
                          >
                            ✓ {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: VOICE RECORDER */}
                {symptomTab === 'voice' && (
                  <div className="py-2">
                    <VoiceRecorder
                      onRecordingComplete={(blob) => {
                        setVoiceBlob(blob);
                      }}
                    />
                  </div>
                )}

                {/* Clinical Emergency Flags Grid */}
                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">
                    Specific Clinical Parameters (If Known)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        SpO2 Oxygen %
                      </label>
                      <input
                        type="number"
                        value={spo2Percent}
                        onChange={(e) => setSpo2Percent(e.target.value)}
                        placeholder="e.g. 91"
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Chest Pain (Minutes)
                      </label>
                      <input
                        type="number"
                        value={chestPainMin}
                        onChange={(e) => setChestPainMin(e.target.value)}
                        placeholder="e.g. 35"
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Fever Duration (Days)
                      </label>
                      <input
                        type="number"
                        value={feverDays}
                        onChange={(e) => setFeverDays(e.target.value)}
                        placeholder="e.g. 3"
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        BP Systolic (mmHg)
                      </label>
                      <input
                        type="number"
                        value={bpSystolic}
                        onChange={(e) => setBpSystolic(e.target.value)}
                        placeholder="e.g. 185"
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
                      <label className="flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={maternalBleeding}
                          onChange={(e) => setMaternalBleeding(e.target.checked)}
                          className="w-4 h-4 text-red-600"
                        />
                        <span>Maternal Bleeding?</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-teal-700 hover:bg-teal-800 shadow flex items-center gap-1.5 transition"
                  >
                    <span>Next: Attach Lab Report</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 3: LAB REPORT UPLOAD & FINAL SUBMIT */}
            {/* ========================================================================= */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-slate-100 pb-2 mb-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Camera className="w-5 h-5 text-teal-700" />
                    <span>Attach Lab Report Photo (Optional OCR)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Photograph of CBC, SpO2 reading, or BP monitor will be extracted by Tesseract OCR.
                  </p>
                </div>

                <ReportUploader
                  onFileSelected={(file) => setReportFile(file)}
                />

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-800 block">Intake Summary:</span>
                  <div>• Patient: {patientName || 'Anonymous'} ({gender}, {age || 'N/A'} yrs)</div>
                  <div>• Symptoms: {symptomsText || (selectedBodyParts.length > 0 ? selectedBodyParts.join(', ') : 'Recorded via Voice/Report')}</div>
                  {voiceBlob && <div>• Voice Recording: Attached (Whisper STT ready)</div>}
                  {reportFile && <div>• Report Photo: {reportFile.name} (OCR ready)</div>}
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleSubmit}
                    className="px-8 py-3 rounded-xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 shadow-xl flex items-center gap-2 transition-all transform hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-orange-300" />
                        <span>Evaluating Safety Rules & OCR...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-orange-300" />
                        <span>{t('submit', 'Submit Triage Case')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* STEP 4: INSTANT TRIAGE RESULT */}
            {/* ========================================================================= */}
            {step === 4 && resultCase && (
              <div className="space-y-6 text-center animate-fade-in py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-200 mx-auto text-teal-700">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    Triage Case Registered Successfully
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Case ID: <span className="font-mono font-bold text-slate-800">{resultCase.id}</span>
                  </p>
                </div>

                {/* Risk Badge & Evidence Box */}
                <div className="max-w-md mx-auto p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Automated Deterministic Risk Classification
                  </span>
                  <div className="flex justify-center">
                    <RiskBadge
                      tag={resultCase.risk_tag || 'GREEN'}
                      message={resultCase.rule_message || 'Standard priority'}
                      size="lg"
                    />
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    "{resultCase.rule_message || 'No red-flag emergency criteria met.'}"
                  </p>
                </div>

                {/* Next Steps for Patient */}
                <div className="max-w-md mx-auto space-y-3 pt-2">
                  <Link
                    to="/while-you-wait"
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 shadow transition flex items-center justify-center gap-2"
                  >
                    <span>💡 {t('while_you_wait', 'While You Wait Health Literacy Quiz')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition"
                  >
                    + Submit Another Case
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
