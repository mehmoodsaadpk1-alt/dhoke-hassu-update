import React, { useEffect, useState } from 'react';
import { videoService, VideoMetadata } from '../../services/VideoService';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import { VideoUploadStudio } from './VideoUploadStudio';

interface VideosModuleProps {
  userId: string;
}

export const VideosModule: React.FC<VideosModuleProps> = ({ userId }) => {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const data = await videoService.getVideos();
      setVideos(data || []);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Watch</h1>
        <button 
          onClick={() => setShowUpload(!showUpload)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          {showUpload ? 'Back to Feed' : 'Upload Video'}
        </button>
      </div>

      {showUpload ? (
        <VideoUploadStudio 
          userId={userId} 
          onComplete={() => {
            setShowUpload(false);
            fetchVideos();
          }} 
        />
      ) : (
        <div className="grid gap-8">
          {loading ? (
            <div className="text-center py-12">Loading videos...</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No videos found. Be the first to upload!</div>
          ) : (
            videos.map(video => (
              <div key={video.id} className="bg-white rounded-xl shadow overflow-hidden">
                <div className="h-96 w-full bg-black">
                  <CustomVideoPlayer url={video.video_url} poster={video.thumbnail_url} />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">{video.title || 'Untitled Video'}</h3>
                  <p className="text-gray-600 mt-1 text-sm">{video.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
