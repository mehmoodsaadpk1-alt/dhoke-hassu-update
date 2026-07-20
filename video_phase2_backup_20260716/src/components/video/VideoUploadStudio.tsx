import React, { useState, useRef } from 'react';
import { videoStorageProvider } from '../../services/VideoStorageProvider';
import { videoService, VideoMetadata, UploadStage } from '../../services/VideoService';

export const VideoUploadStudio: React.FC<{ userId: string; onComplete?: () => void }> = ({ userId, onComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<UploadStage>('Queued');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const startUpload = async () => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setError('File exceeds 50MB limit.');
      return;
    }

    try {
      setStage('Compressing');
      setProgress(10);
      
      // Hybrid Compression Logic (Mocked for Phase 1 Foundation)
      let fileToUpload = file;
      if (file.size > 30 * 1024 * 1024) {
        console.log('File > 30MB, initiating ffmpeg compression (mock)');
        await new Promise(r => setTimeout(r, 2000)); // Simulate compression delay
        setProgress(30);
      }

      setStage('Generating Thumbnail');
      setProgress(40);
      // Thumbnail logic (mocked)
      await new Promise(r => setTimeout(r, 1000));
      
      setStage('Uploading');
      setProgress(50);
      const result = await videoStorageProvider.uploadVideo(userId, fileToUpload, (p) => setProgress(50 + (p * 0.4)));
      
      if (result.error) throw result.error;

      // Create DB Record
      setProgress(90);
      const meta: VideoMetadata = {
        user_id: userId,
        type: 'video',
        title,
        description,
        video_url: result.url,
        size: fileToUpload.size,
        encoding_status: 'completed'
      };
      await videoService.createVideoRecord(meta);

      setStage('Completed');
      setProgress(100);
      if (onComplete) onComplete();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Upload failed');
      setStage('Failed');
      // Cleanup logic should go here
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Video Upload Studio</h2>
      
      {stage === 'Queued' || stage === 'Failed' ? (
        <div className="space-y-4">
          <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={handleFileChange} className="w-full" />
          <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded" />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded" />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button onClick={startUpload} disabled={!file} className="w-full bg-blue-600 text-white py-2 rounded font-semibold disabled:opacity-50">
            Start Upload
          </button>
        </div>
      ) : (
        <div className="space-y-4 text-center py-8">
          <h3 className="font-bold text-lg">{stage}...</h3>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div className="bg-blue-600 h-4 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-sm text-gray-500">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
};
