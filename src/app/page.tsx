"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import LyricsDisplay from "@/components/LyricsDisplay";

interface Video {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

export default function Home() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedVideo(null);

    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search");
      }

      const data = await response.json();
      
      if (data.videos && data.videos.length > 0) {
        setSearchResults(data.videos);
      } else {
        setError("No videos found. Try a different search term.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Failed to search");
    } finally {
      setIsSearching(false);
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setSearchResults([]);
  };

  const handleNewSearch = () => {
    setSelectedVideo(null);
    setSearchQuery("");
    setSearchResults([]);
    setError(null);
  };

  // Extract track name and artist from video title
  const extractTrackInfo = (title: string, channelTitle: string) => {
    // Remove common YouTube suffixes
    let cleanTitle = title
      .replace(/\s*\([^)]*\)/g, "") // Remove parentheses
      .replace(/\s*\[[^\]]*\]/g, "") // Remove brackets
      .replace(/\s*Official\s*Video/gi, "")
      .replace(/\s*Official\s*Audio/gi, "")
      .replace(/\s*Music\s*Video/gi, "")
      .replace(/\s*HD/gi, "")
      .replace(/\s*MV/gi, "")
      .trim();

    // Common patterns: "Artist - Song" or "Song - Artist" or "Artist: Song"
    const patterns = [
      /^(.+?)\s*-\s*(.+)$/, // "Artist - Song" (most common)
      /^(.+?)\s*:\s*(.+)$/, // "Artist: Song"
      /^(.+?)\s*\|(.+)$/, // "Artist | Song"
    ];

    for (const pattern of patterns) {
      const match = cleanTitle.match(pattern);
      if (match) {
        const part1 = match[1].trim();
        const part2 = match[2].trim();
        
        // For "Artist - Song" format (most common on YouTube)
        // part1 is usually the artist, part2 is the song
        // But check if part2 looks like it has "ft." - if so, part1 is definitely artist
        if (part2.match(/\s*ft\.|feat\.|featuring/i)) {
          return {
            trackName: part2,
            artistName: part1,
          };
        }
        
        // Default: first part is artist, second is song
        return {
          trackName: part2,
          artistName: part1,
        };
      }
    }

    // Fallback: use title as track name, channel as artist
    // But try to extract artist from channel name (remove "VEVO", etc.)
    let cleanChannel = channelTitle
      .replace(/\s*VEVO/gi, "")
      .replace(/\s*Official/gi, "")
      .trim();

    return {
      trackName: cleanTitle,
      artistName: cleanChannel || channelTitle,
    };
  };

  const trackInfo = selectedVideo
    ? extractTrackInfo(selectedVideo.title, selectedVideo.channelTitle)
    : null;

  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-[#212121] rounded-lg shadow-2xl p-6">
          <h1 className="text-3xl font-bold text-center mb-6 text-white">
            YouTube Music Player
          </h1>

          {/* Search Box - Always visible */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a song on YouTube..."
                className="flex-1 px-4 py-3 bg-[#121212] border border-[#303030] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 text-lg"
                disabled={isSearching}
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-[#272727] hover:bg-[#3d3d3d] text-white rounded-lg disabled:bg-[#1a1a1a] disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2 font-semibold transition-colors border border-[#303030]"
              >
                {isSearching ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && !selectedVideo && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-white">
                Search Results ({searchResults.length})
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((video) => (
                  <button
                    key={video.videoId}
                    onClick={() => handleVideoSelect(video)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-[#303030] rounded-lg transition-colors text-left border border-[#303030]"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-24 h-24 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {video.title}
                      </p>
                      <p className="text-sm text-gray-400 truncate mt-1">
                        {video.channelTitle}
                      </p>
                    </div>
                    <div className="text-blue-400 font-semibold">Select →</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video Player - Only shows after selection */}
          {selectedVideo && (
            <div>
              {/* Video Info */}
              <div className="mb-4 text-center">
                <h2 className="text-xl font-semibold text-white mb-2">
                  {selectedVideo.title}
                </h2>
                <p className="text-gray-400">{selectedVideo.channelTitle}</p>
              </div>

              {/* YouTube Video Embed - Centered */}
              <div className="flex justify-center mb-4">
                <div className="w-full max-w-3xl">
                  <div className="relative" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=0&controls=1&modestbranding=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selectedVideo.title}
                    />
                  </div>
                </div>
              </div>

              {/* New Search Button */}
              <div className="text-center mb-6">
                <button
                  onClick={handleNewSearch}
                  className="px-6 py-2 bg-[#272727] hover:bg-[#3d3d3d] text-white rounded-lg transition-colors border border-[#303030]"
                >
                  Search Another Song
                </button>
              </div>
            </div>
          )}

          {/* Lyrics Display - Shows when video is selected */}
          {trackInfo && (
            <div className="mt-6">
              <LyricsDisplay
                trackName={trackInfo.trackName}
                artistName={trackInfo.artistName}
                currentTime={0}
              />
            </div>
          )}

          {/* Initial State - Show when no search and no video selected */}
          {!selectedVideo && searchResults.length === 0 && !isSearching && !error && (
            <div className="text-center py-12">
              <Search size={64} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg">
                Enter a song name above to search YouTube
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
