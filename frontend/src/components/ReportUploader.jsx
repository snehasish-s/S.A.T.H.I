import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCase } from '../hooks/useCase';

const ReportUploader = ({ caseId, onUploadComplete }) => {
  const { t } = useTranslation();
  const { submitReport, loading, error } = useCase();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrResults, setOcrResults] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setOcrResults(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setOcrResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !caseId) return;
    try {
      const result = await submitReport(caseId, file);
      // Assuming result contains OCR results
      setOcrResults(result.ocr_results || { extracted: 'Sample extraction due to prototype' });
      if (onUploadComplete) onUploadComplete(result);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full">
      {!ocrResults ? (
        <div className="flex flex-col items-center">
          <div 
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mb-4 rounded" />
            ) : (
              <div className="text-gray-500 flex flex-col items-center">
                <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p>Click or drag image to upload</p>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
          </div>

          <div className="mt-4 flex gap-4 w-full justify-center">
            <button 
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center gap-2"
              onClick={() => cameraInputRef.current?.click()}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              Camera
            </button>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              className="hidden" 
              ref={cameraInputRef} 
              onChange={handleFileChange}
            />
            {file && (
              <button 
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className="px-4 py-2 bg-sahayak-teal text-white rounded hover:bg-sahayak-dark disabled:opacity-50"
              >
                {loading ? t('uploading') : t('submit')}
              </button>
            )}
          </div>
          {error && <p className="text-safety-red mt-2 text-sm">{error}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Original</h4>
            <img src={preview} alt="Original" className="max-w-full rounded border" />
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Extracted Data</h4>
            <div className="bg-gray-50 p-4 rounded border text-sm overflow-auto">
              <pre>{JSON.stringify(ocrResults, null, 2)}</pre>
            </div>
            <button 
              className="mt-4 px-4 py-2 text-sm text-sahayak-teal border border-sahayak-teal rounded hover:bg-teal-50"
              onClick={() => { setFile(null); setPreview(null); setOcrResults(null); }}
            >
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportUploader;
