import { useEffect, useRef, useState } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { Button } from "@/components/ui/button";
import { Comment } from "@shared/schema";
import { formatTime, calculateMarkerPosition } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  uploadDate: string;
  comments: Comment[];
  onAddComment: () => void;
  onShareVideo: () => void;
  onCommentClick: (timestamp: number) => void;
}

export function VideoPlayer({
  videoUrl,
  title,
  uploadDate,
  comments,
  onAddComment,
  onShareVideo,
  onCommentClick
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressWidth, setProgressWidth] = useState("0%");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!videoRef.current) return;
    
    // Initialize Plyr
    const player = new Plyr(videoRef.current, {
      controls: [],
      clickToPlay: false,
      keyboard: { focused: true, global: true },
    });
    
    playerRef.current = player;
    
    // Event listeners
    player.on("timeupdate", () => {
      const video = videoRef.current;
      if (!video) return;
      
      const currentTime = video.currentTime;
      const duration = video.duration || 0;
      
      setCurrentTime(currentTime);
      setDuration(duration);
      setProgressWidth(`${(currentTime / duration) * 100}%`);
    });
    
    player.on("play", () => setIsPlaying(true));
    player.on("pause", () => setIsPlaying(false));
    player.on("ended", () => setIsPlaying(false));
    
    player.on("loadedmetadata", () => {
      const video = videoRef.current;
      if (video) {
        setDuration(video.duration);
      }
    });
    
    return () => {
      player.destroy();
    };
  }, [videoUrl]);
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const seekTime = duration * clickPosition;
    
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };
  
  const togglePlayPause = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  };
  
  const seekBackward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, currentTime - 10);
  };
  
  const seekForward = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(duration, currentTime + 10);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-fade-in">
      {/* Video Header */}
      <div className="p-4 border-b sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">Uploaded {uploadDate}</p>
        </div>
        <div className="mt-3 sm:mt-0 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onShareVideo}
            className="inline-flex items-center gap-1.5"
          >
            <i className="ri-share-line"></i>
            Share
          </Button>
          <Button
            size="sm"
            onClick={onAddComment}
            className="inline-flex items-center gap-1.5"
          >
            <i className="ri-add-line"></i>
            Add Comment
          </Button>
        </div>
      </div>

      {/* Video Player */}
      <div className="aspect-w-16 aspect-h-9 bg-gray-900 relative">
        <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain"></video>
        
        {/* Video Controls Overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              onClick={togglePlayPause}
            >
              <i className="ri-play-fill text-3xl"></i>
            </button>
          </div>
        )}
        
        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          {/* Timeline with comment markers */}
          <div className="relative mb-4">
            <div 
              className="video-progress"
              ref={progressRef}
              onClick={handleProgressClick}
            >
              <div 
                className="video-progress-filled"
                style={{ width: progressWidth }}
              ></div>
            </div>
            
            {/* Comment Markers */}
            {comments.map((comment, index) => (
              <div 
                key={`marker-${index}`}
                className="comment-marker" 
                style={{ left: calculateMarkerPosition(comment.timestamp, duration) }}
                title={`Comment at ${formatTime(comment.timestamp)}`}
                onClick={() => onCommentClick(comment.timestamp)}
              ></div>
            ))}
            
            {/* Timeline Ticks */}
            <div className="timeline-tick" style={{ left: "0%" }}>
              <div className="timeline-label">0:00</div>
            </div>
            <div className="timeline-tick" style={{ left: "25%" }}>
              <div className="timeline-label">{formatTime(duration * 0.25)}</div>
            </div>
            <div className="timeline-tick" style={{ left: "50%" }}>
              <div className="timeline-label">{formatTime(duration * 0.5)}</div>
            </div>
            <div className="timeline-tick" style={{ left: "75%" }}>
              <div className="timeline-label">{formatTime(duration * 0.75)}</div>
            </div>
            <div className="timeline-tick" style={{ left: "100%" }}>
              <div className="timeline-label">{formatTime(duration)}</div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <button 
                className="p-1 hover:text-primary-200 focus:outline-none"
                onClick={seekBackward}
              >
                <i className="ri-rewind-line text-xl"></i>
              </button>
              <button 
                className="p-1 hover:text-primary-200 focus:outline-none"
                onClick={togglePlayPause}
              >
                <i className={`ri-${isPlaying ? 'pause' : 'play'}-line text-xl`}></i>
              </button>
              <button 
                className="p-1 hover:text-primary-200 focus:outline-none"
                onClick={seekForward}
              >
                <i className="ri-speed-line text-xl"></i>
              </button>
              <span className="text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-1 hover:text-primary-200 focus:outline-none">
                <i className="ri-volume-up-line text-xl"></i>
              </button>
              <button 
                className="p-1 hover:text-primary-200 focus:outline-none"
                onClick={() => playerRef.current?.toggleFullscreen()}
              >
                <i className="ri-fullscreen-line text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
