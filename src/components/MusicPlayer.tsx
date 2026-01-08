"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, Search } from "lucide-react";

interface Video {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

interface MusicPlayerProps {
  video: Video | null;
  onSearch: (query: string) => void;
}

export default function MusicPlayer({ video, onSearch }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [searchQuery, setSearchQuery] = useState("");
  const playerRef = useRef<HTMLIFrameElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (video) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [video]);

  useEffect(() => {
    if (isPlaying && playerRef.current) {
      // YouTube iframe API would be needed for better control
      // For now, we'll use basic iframe embedding
      intervalRef.current = setInterval(() => {
        // Note: YouTube iframe API is needed for accurate time tracking
        // This is a simplified version
        setCurrentTime((prev) => {
          if (prev >= duration && duration > 0) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
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
  }, [isPlaying, duration]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // YouTube iframe API would handle this properly
    // For now, this is a placeholder
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!video) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a song..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
          >
            <Search size={20} />
            Search
          </button>
        </form>
        <div className="text-center text-gray-500 py-12">
          <p>Search for a song to start playing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Hidden YouTube iframe for audio playback */}
      <div className="hidden">
        <iframe
          ref={playerRef}
          width="0"
          height="0"
          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=${isPlaying ? 1 : 0}&controls=0&modestbranding=1&rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for a song..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Search size={20} />
          Search
        </button>
      </form>

      {/* Song Info */}
      <div className="flex items-center gap-4 mb-6">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{video.title}</h3>
          <p className="text-sm text-gray-600">{video.channelTitle}</p>
        </div>
      </div>

      {/* Player Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="w-full">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 0)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 cursor-pointer">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <Volume2 size={20} className="text-gray-600" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600 w-10">{volume}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
