import { useState, useRef, useEffect } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { formatTimestamp } from "./categorized-comments";
import { Comment } from "@/shared/schema";
import { calculateMarkerPosition } from "@/lib/utils";

interface VideoMarker {
  id: number;
  timestamp: number;
  color: string;
  category: string;
}

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string | null;
  comments: Comment[];
  onTimeUpdate?: (currentTime: number) => void;
  onCommentAtTime?: (time: number) => void;
  onSeekToMarker?: (time: number) => void;
}

// Helper function to get category color for markers
const getCategoryColor = (category?: string | null) => {
  switch (category) {
    case "technique":
      return "bg-blue-500";
    case "interpretation":
      return "bg-purple-500";
    case "expression":
      return "bg-pink-500";
    case "rhythm":
      return "bg-orange-500";
    case "tone":
      return "bg-yellow-500";
    default:
      return "bg-green-500";
  }
};

export default function EnhancedVideoPlayer({ 
  videoUrl, 
  thumbnailUrl, 
  comments,
  onTimeUpdate,
  onCommentAtTime,
  onSeekToMarker
}: EnhancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [markers, setMarkers] = useState<VideoMarker[]>([]);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Initialize Plyr
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;
    
    // Reset error state when video URL changes
    setVideoError(null);
    
    if (playerRef.current) {
      playerRef.current.destroy();
    }
    
    // Enhanced logging for video URL debugging
    console.log(`[EnhancedVideoPlayer] Setting up video player with URL: ${videoUrl}`);
    console.log(`[EnhancedVideoPlayer] URL analysis:`, {
      urlLength: videoUrl?.length || 0,
      urlStartsWithHttps: videoUrl?.startsWith('https://'),
      containsSupabaseHost: videoUrl?.includes('supabase'),
      containsVideosBucket: videoUrl?.includes('videos'),
      urlEndsWithValidExt: /\.(mp4|webm|mov|avi)$/i.test(videoUrl || ''),
      timestamp: new Date().toISOString()
    });
    
    // Comprehensive URL validation before initializing player
    console.log(`[EnhancedVideoPlayer] Checking if video URL is accessible with HEAD request`);
    
    fetch(videoUrl, { 
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
      .then(response => {
        console.log(`[EnhancedVideoPlayer] URL HEAD check response:`, {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
          cacheControl: response.headers.get('cache-control'),
          timestamp: new Date().toISOString()
        });
        
        if (!response.ok) {
          console.error(`[EnhancedVideoPlayer] Video URL check failed with status: ${response.status}`);
          setVideoError(`Video file not accessible (HTTP ${response.status}): ${response.statusText}`);
          return;
        }
        
        // URL is valid, initialize player
        console.log(`[EnhancedVideoPlayer] URL check successful, initializing player`);
        initializePlayer();
      })
      .catch(error => {
        console.error(`[EnhancedVideoPlayer] Error checking video URL:`, error);
        console.error(`[EnhancedVideoPlayer] Error details:`, {
          name: error.name,
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        setVideoError(`Error accessing video: ${error.message}`);
      });
      
    function initializePlayer() {
      try {
        const player = new Plyr(videoRef.current!, {
          controls: [
            'play-large', 'play', 'progress', 'current-time', 
            'mute', 'volume', 'settings', 'fullscreen'
          ],
          autoplay: false,
          muted: false,
          seekTime: 5,
          keyboard: { focused: true, global: false },
          debug: true
        });
        
        player.on('ready', () => {
          console.log('[EnhancedVideoPlayer] Plyr player ready event fired', {
            duration: player.duration,
            currentTime: player.currentTime,
            muted: player.muted,
            volume: player.volume,
            playing: player.playing,
            timestamp: new Date().toISOString()
          });
          setIsReady(true);
          setDuration(player.duration || 0);
        });
        
        player.on('loadedmetadata', () => {
          console.log('[EnhancedVideoPlayer] Video metadata loaded', {
            duration: player.duration,
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight,
            readyState: videoRef.current?.readyState,
            timestamp: new Date().toISOString()
          });
          setDuration(player.duration || 0);
        });
        
        player.on('loadeddata', () => {
          console.log('[EnhancedVideoPlayer] Video data loaded', {
            duration: player.duration,
            buffered: videoRef.current?.buffered.length > 0 ? 
              `${videoRef.current?.buffered.start(0)} - ${videoRef.current?.buffered.end(0)}` : 'none',
            networkState: videoRef.current?.networkState,
            timestamp: new Date().toISOString()
          });
        });
        
        player.on('timeupdate', () => {
          setCurrentTime(player.currentTime || 0);
          if (onTimeUpdate) {
            onTimeUpdate(player.currentTime || 0);
          }
        });
        
        player.on('error', (event) => {
          console.error('[EnhancedVideoPlayer] Plyr error event:', event);
          
          // Analyze video element errors
          if (videoRef.current) {
            const videoError = videoRef.current.error;
            console.error('[EnhancedVideoPlayer] Video element error details:', {
              code: videoError?.code,
              message: videoError?.message,
              MEDIA_ERR_ABORTED: (videoError?.code === 1) ? 'Yes' : 'No',
              MEDIA_ERR_NETWORK: (videoError?.code === 2) ? 'Yes' : 'No',
              MEDIA_ERR_DECODE: (videoError?.code === 3) ? 'Yes' : 'No',
              MEDIA_ERR_SRC_NOT_SUPPORTED: (videoError?.code === 4) ? 'Yes' : 'No',
              networkState: videoRef.current.networkState,
              readyState: videoRef.current.readyState,
              timestamp: new Date().toISOString()
            });
            
            // Provide more helpful error message based on error code
            if (videoError) {
              switch(videoError.code) {
                case 1:
                  setVideoError('Video playback was aborted. Please try again.');
                  break;
                case 2:
                  setVideoError('Network error. Please check your connection and try again.');
                  break;
                case 3:
                  setVideoError('Video decoding failed. The file might be corrupted.');
                  break;
                case 4:
                  setVideoError('Video format not supported by your browser or the file is invalid.');
                  break;
                default:
                  setVideoError('Error loading video. Please try again later.');
              }
            } else {
              setVideoError('Error loading video. Please try again later.');
            }
          } else {
            setVideoError('Error loading video. Please try again later.');
          }
        });
        
        playerRef.current = player;
      } catch (error) {
        console.error('Error initializing Plyr:', error);
        setVideoError(`Player initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [onTimeUpdate, videoUrl, loadAttempts]);
  
  // Create markers from comments with timestamps
  useEffect(() => {
    if (!comments || !isReady) return;
    
    const newMarkers: VideoMarker[] = comments
      .filter(comment => comment.timestamp !== null && comment.timestamp !== undefined)
      .map(comment => ({
        id: comment.id,
        timestamp: comment.timestamp || 0,
        color: getCategoryColor(comment.category),
        category: comment.category || "general"
      }));
    
    setMarkers(newMarkers);
  }, [comments, isReady]);
  
  // Handle marker click
  const handleMarkerClick = (marker: VideoMarker) => {
    if (!playerRef.current) return;
    
    playerRef.current.currentTime = marker.timestamp;
    playerRef.current.play();
    
    if (onSeekToMarker) {
      onSeekToMarker(marker.timestamp);
    }
  };
  
  // Handle add comment at current time
  const handleAddCommentAtTime = () => {
    if (!playerRef.current || !onCommentAtTime) return;
    playerRef.current.pause();
    onCommentAtTime(playerRef.current.currentTime || 0);
  };
  
  // Extract video ID for Plyr poster (thumbnail)
  const getPosterUrl = () => {
    if (thumbnailUrl) return thumbnailUrl;
    
    // Try to extract thumbnail from YouTube URL
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const match = videoUrl.match(youtubeRegex);
      
      if (match && match[1]) {
        return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
      }
    }
    
    return undefined;
  };
  
  // Handle retry for video loading
  const handleRetry = () => {
    setLoadAttempts(prev => prev + 1);
  };

  if (videoError) {
    return (
      <div className="relative glassmorphism border border-gray-700 rounded-md overflow-hidden">
        <div className="h-[400px] flex items-center justify-center bg-gray-900">
          <div className="text-center p-6">
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <i className="ri-error-warning-line text-3xl text-red-300"></i>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Video Error</h3>
            <p className="text-gray-300 max-w-md mb-6">
              {videoError}
            </p>
            <div className="flex space-x-4 justify-center">
              <button 
                className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-md"
                onClick={handleRetry}
              >
                <i className="ri-refresh-line mr-1.5"></i>
                Retry
              </button>
              <a 
                href={videoUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md"
              >
                <i className="ri-external-link-line mr-1.5"></i>
                Open Directly
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Debug info: URL: {videoUrl.substring(0, 50)}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative glassmorphism border border-gray-700 rounded-md overflow-hidden">
      <div ref={containerRef} className="relative group">
        <video
          ref={videoRef}
          className="plyr-video" 
          poster={getPosterUrl()}
          preload="metadata"
          onError={() => setVideoError("Video cannot be played. The file might be corrupted or in an unsupported format.")}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support HTML5 video.
        </video>
        
        {/* Timestamp markers */}
        {duration > 0 && (
          <div className="absolute bottom-[54px] left-0 w-full h-4 px-2.5">
            {markers.map((marker) => (
              <div
                key={marker.id}
                className={`absolute w-2 h-2 ${marker.color} rounded-full cursor-pointer transform -translate-y-2 hover:scale-150 transition-transform tooltip-trigger z-10`}
                style={{ left: calculateMarkerPosition(marker.timestamp, duration) }}
                onClick={() => handleMarkerClick(marker)}
              >
                <div className="tooltip-content opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
                  {formatTimestamp(marker.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Custom controls overlay */}
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="bg-gray-900/90 hover:bg-gray-800 text-white rounded-full h-8 w-8 flex items-center justify-center mr-2 tooltip-trigger"
            onClick={handleAddCommentAtTime}
          >
            <i className="ri-chat-1-line"></i>
            <div className="tooltip-content opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity">
              Comment at {formatTimestamp(currentTime)}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}