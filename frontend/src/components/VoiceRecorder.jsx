import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCase } from '../hooks/useCase';

const VoiceRecorder = ({ caseId, onUploadComplete }) => {
  const { t } = useTranslation();
  const { submitVoice, loading, error } = useCase();
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Microphone access denied or not supported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    if (!audioBlob || !caseId) return;
    try {
      const result = await submitVoice(caseId, audioBlob);
      setTranscript(result.transcript || 'Sample transcript extracted from voice.');
      if (onUploadComplete) onUploadComplete(result);
    } catch (err) {
      console.error(err);
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setTranscript(null);
    setDuration(0);
  };

  return (
    <div className="w-full flex flex-col items-center bg-gray-50 p-6 rounded-lg border border-gray-200">
      {!transcript ? (
        <>
          <div className="mb-6 flex justify-center items-center h-24">
            {isRecording ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-safety-red rounded-full animate-pulse flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                </div>
                <span className="mt-2 text-safety-red font-mono font-bold">{formatTime(duration)}</span>
              </div>
            ) : audioUrl ? (
              <audio src={audioUrl} controls className="w-full max-w-sm" />
            ) : (
              <div className="text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                <p>Record symptoms</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {!isRecording && !audioUrl && (
              <button
                type="button"
                onClick={startRecording}
                className="px-6 py-2 bg-sahayak-teal text-white rounded-full hover:bg-sahayak-dark flex items-center gap-2"
              >
                Start Recording
              </button>
            )}
            
            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="px-6 py-2 bg-safety-red text-white rounded-full hover:bg-red-700 flex items-center gap-2"
              >
                Stop Recording
              </button>
            )}

            {audioUrl && !isRecording && (
              <>
                <button
                  type="button"
                  onClick={discardRecording}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={loading}
                  className="px-6 py-2 bg-sahayak-teal text-white rounded hover:bg-sahayak-dark disabled:opacity-50"
                >
                  {loading ? t('uploading') : t('submit')}
                </button>
              </>
            )}
          </div>
          {error && <p className="text-safety-red mt-2 text-sm">{error}</p>}
        </>
      ) : (
        <div className="w-full text-left">
          <h4 className="font-medium text-gray-700 mb-2">Transcript</h4>
          <div className="bg-white p-4 rounded border text-gray-800 mb-4 shadow-inner">
            <p>{transcript}</p>
          </div>
          <button
            type="button"
            onClick={discardRecording}
            className="px-4 py-2 text-sm text-sahayak-teal border border-sahayak-teal rounded hover:bg-teal-50"
          >
            Record Again
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
