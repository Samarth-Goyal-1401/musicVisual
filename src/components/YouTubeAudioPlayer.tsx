"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Loader2, Music } from "lucide-react";

interface YouTubeAudioPlayerProps {
  videoId: string;
  title: string;
  onTimeUpdate?: (currentTime: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubeAudioPlayer({ videoId, title, onTimeUpdate }: YouTubeAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    const loadYouTubeAPI = () => {
      if (window.YT) {
        setIsAPIReady(true);
        setIsLoading(false);
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsAPIReady(true);
        setIsLoading(false);
      };
    };

    loadYouTubeAPI();
  }, []);

  // Initialize player when API is ready and videoId changes
  useEffect(() => {
    if (!isAPIReady || !videoId) return;

    // Fetch video duration as fallback
    const fetchVideoDuration = async () => {
      try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || 'AIzaSyDuRts3zrhtIdkQLxvKeSQhUJkfaJR9Jro'}`);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          const duration = data.items[0].contentDetails.duration;
          // Convert ISO 8601 duration to seconds
          const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
          if (match) {
            const hours = parseInt(match[1]) || 0;
            const minutes = parseInt(match[2]) || 0;
            const seconds = parseInt(match[3]) || 0;
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            setDuration(totalSeconds);
            console.log("Duration from API:", totalSeconds);
          }
        }
      } catch (error) {
        console.log("Could not fetch duration from API:", error);
      }
    };

    fetchVideoDuration();

    const initializePlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          cc_load_policy: 0,
        },
        events: {
          onReady: (event: any) => {
            console.log("YouTube player ready");
            event.target.setVolume(volume);
            setError(null);
            
            // Get video duration when ready
            const duration = event.target.getDuration();
            if (duration && duration > 0) {
              setDuration(duration);
              console.log("Video duration:", duration);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startInterval();
              
              // Get duration when video starts playing (more reliable)
              const duration = event.target.getDuration();
              if (duration && duration > 0) {
                setDuration(duration);
                console.log("Video duration from playing state:", duration);
              }
            } else if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              stopInterval();
            }
          },
          onError: (event: any) => {
            console.error("YouTube player error:", event);
            setError("Failed to load YouTube video. The video might be private or unavailable.");
          },
        },
      });
    };

    // Small delay to ensure DOM is ready
    setTimeout(initializePlayer, 100);

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      stopInterval();
    };
  }, [isAPIReady, videoId]);

  const startInterval = () => {
    stopInterval();
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time);
        
        // Also update duration periodically in case it changes
        const currentDuration = playerRef.current.getDuration();
        if (currentDuration && currentDuration > 0 && currentDuration !== duration) {
          setDuration(currentDuration);
        }
      }
    }, 100);
  };

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    console.log("Seeking to:", newTime, "Duration:", duration);
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    } else {
      console.log("Player not ready for seeking");
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg text-center">
        <Loader2 size={48} className="mx-auto animate-spin text-blue-500" />
        <p className="mt-4 text-gray-400">Loading YouTube player...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg text-center">
        <Music size={48} className="mx-auto mb-4 text-red-400" />
        <p className="text-red-400 mb-2">Audio unavailable</p>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg">
      {/* Hidden YouTube player */}
      <div id="youtube-player" style={{ display: 'none' }} />

      {/* Song Info */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400">Playing via YouTube</p>
      </div>

      {/* Player Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(duration > 0 ? (currentTime / duration) * 100 : 0)}%, #374151 ${(duration > 0 ? (currentTime / duration) * 100 : 0)}%, #374151 100%)`
            }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={togglePlayPause}
            className="w-16 h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          
          <div className="flex items-center gap-3">
            <Volume2 size={20} className="text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #374151 ${volume}%, #374151 100%)`
              }}
            />
            <span className="text-sm text-gray-400 w-10">{volume}%</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          cursor: pointer;
          border-radius: 50%;
          border: none;
        }
      `}</style>
    </div>
  );
}
