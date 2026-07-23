import React, { useState, useRef } from 'react';
import { UploadStage } from '../../services/VideoService';
import { videoUploadService } from '../../services/VideoUploadService';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

export const VideoUploadStudio: React.FC<{ userId: string; onComplete?: () => void }> = ({ userId, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<UploadStage>('Queued');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Strict Limits
  const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Security Validation
      if (selectedFile.size > MAX_FILE_SIZE) {
        setError('File exceeds 250MB maximum limit.');
        setFile(null);
        return;
      }
      
      const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Only MP4, MOV, and WEBM are supported.');
        setFile(null);
        return;
      }

      setError('');
      setFile(selectedFile);
      setStage('Queued');
      setProgress(0);
    }
  };

  const startUpload = async () => {
    if (!file) return;
    setError('');
    
    abortControllerRef.current = new AbortController();

    try {
      await videoUploadService.processAndUpload({
        userId,
        file,
        title,
        description,
        type: 'short', // Or toggleable in UI
        signal: abortControllerRef.current.signal,
        onProgress: setProgress,
        onStageChange: setStage
      });
      
      if (onComplete) {
        setTimeout(() => onComplete(), 1500);
      }

    } catch (err: any) {
      if (err.message === 'Upload cancelled by user') {
        setStage('Cancelled');
        setError('Upload cancelled by user.');
      } else {
        console.error(err);
        setError(err.message || 'An error occurred during processing/upload.');
        setStage('Failed');
      }
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    } else {
      setStage('Cancelled');
      setError('Upload cancelled by user.');
    }
    setProgress(0);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-auto border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Upload Video</h2>
        {stage !== 'Completed' && stage !== 'Queued' && (
          <button onClick={cancelUpload} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        )}
      </div>
      
      {(stage === 'Queued' || stage === 'Failed' || stage === 'Cancelled') ? (
        <div className="space-y-4">
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
            <input 
              type="file" 
              id="video-upload"
              accept="video/mp4,video/quicktime,video/webm" 
              onChange={handleFileChange} 
              className="hidden" 
            />
            <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
              <Upload size={32} className="text-blue-500 mb-2" />
              <span className="font-semibold text-gray-700">Select Video</span>
              <span className="text-xs text-gray-500 mt-1">MP4, MOV, WEBM (Max 250MB)</span>
            </label>
            {file && (
              <div className="mt-4 p-2 bg-blue-50 rounded text-sm text-blue-800 break-all">
                Selected: {file.name} ({(file.size / (1024*1024)).toFixed(1)}MB)
              </div>
            )}
          </div>

          <input 
            type="text" 
            placeholder="Title (optional)" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
          <textarea 
            placeholder="Description (optional)" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            className="w-full border p-3 rounded-lg min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
          />
          
          {error && (
            <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle size={16} className="me-2 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <button 
            onClick={startUpload} 
            disabled={!file} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {stage === 'Failed' || stage === 'Cancelled' ? 'Retry Upload' : 'Start Upload'}
          </button>
        </div>
      ) : (
        <div className="space-y-6 text-center py-8">
          {stage === 'Completed' ? (
            <div className="flex flex-col items-center animate-in zoom-in duration-300">
              <CheckCircle size={64} className="text-green-500 mb-4" />
              <h3 className="font-bold text-xl text-gray-800">Upload Complete!</h3>
              <p className="text-sm text-gray-500 mt-2">Your video is now live.</p>
            </div>
          ) : (
            <>
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="48" cy="48" />
                  <circle 
                    className="text-blue-600 transition-all duration-300 ease-out" 
                    strokeWidth="8" 
                    strokeDasharray={251.2} 
                    strokeDashoffset={251.2 - (251.2 * progress) / 100} 
                    strokeLinecap="round" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r="40" 
                    cx="48" 
                    cy="48" 
                  />
                </svg>
                <div className="absolute text-lg font-bold text-gray-700">{Math.round(progress)}%</div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-800">{stage}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {stage === 'Preparing video' ? 'Extracting metadata...' :
                   stage === 'Compressing video' ? 'Optimizing video for mobile...' : 
                   stage === 'Saving Database' ? 'Finalizing...' : 
                   'Sending to secure storage...'}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
