"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Loader2, Music } from "lucide-react";

interface AudioPlayerProps {
  videoId: string;
  title: string;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function AudioPlayer({ videoId, title, onTimeUpdate }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch audio URL when component mounts or videoId changes
  useEffect(() => {
    if (videoId) {
      fetchAudioUrl();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId]);

  // Update time tracking
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          onTimeUpdate?.(audioRef.current.currentTime);
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, onTimeUpdate]);

  const fetchAudioUrl = async () => {
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    setFallbackUrl(null);
    setUseFallback(false);

    try {
      const response = await fetch(`/api/youtube/audio?videoId=${videoId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract audio");
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      setFallbackUrl(data.fallbackUrl);
      setDuration(data.duration || 0);
    } catch (err) {
      console.error("Audio extraction error:", err);
      setError(err instanceof Error ? err.message : "Failed to load audio");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || !audioUrl) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        console.log("Audio paused");
        setIsPlaying(false);
      } else {
        // Ensure the audio is loaded before playing
        if (audioRef.current.readyState < 2) {
          console.log("Audio not ready, waiting...");
          await new Promise((resolve) => {
            audioRef.current!.addEventListener('canplay', resolve, { once: true });
          });
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log("Audio playing successfully");
            setIsPlaying(true);
          }).catch((error) => {
            console.error("Play failed:", error);
            setError("Failed to play audio. Click play button again or try a different video.");
            setIsPlaying(false);
          });
        }
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setError("Audio playback failed. The video might be protected.");
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
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
        <p className="mt-4 text-gray-400">Extracting audio from YouTube...</p>
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

  if (!audioUrl) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg text-center text-gray-400">
        <Music size={48} className="mx-auto mb-4 opacity-50" />
        <p>Audio player will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={useFallback ? (fallbackUrl || undefined) : (audioUrl || undefined)}
        preload="metadata"
        crossOrigin="anonymous"
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          setDuration(audio.duration || 0);
          console.log("Audio loaded, duration:", audio.duration, "using fallback:", useFallback);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          onTimeUpdate?.(0);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
          onTimeUpdate?.(e.currentTarget.currentTime);
        }}
        onError={(e) => {
          console.error("Audio error:", e);
          if (!useFallback && fallbackUrl) {
            console.log("Trying fallback URL...");
            setUseFallback(true);
          } else {
            setError("Failed to load audio. The video might be protected or unavailable.");
          }
        }}
        onCanPlay={() => {
          console.log("Audio can play");
        }}
      />

      {/* Song Info */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400">Audio extracted from YouTube</p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => {
                console.log("Audio URL:", audioUrl);
                console.log("Fallback URL:", fallbackUrl);
                console.log("Audio element:", audioRef.current);
                console.log("Ready state:", audioRef.current?.readyState);
                alert(`Audio URL: ${audioUrl?.substring(0, 100)}...`);
              }}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
            >
              Debug Audio URL
            </button>
            {fallbackUrl && (
              <button
                onClick={() => {
                  setUseFallback(!useFallback);
                  console.log("Switched to fallback:", !useFallback);
                }}
                className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded"
              >
                {useFallback ? "Use Direct" : "Use Fallback"}
              </button>
            )}
          </div>
        )}
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
