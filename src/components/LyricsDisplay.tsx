"use client";

import { useState, useEffect } from "react";
import { Loader2, Music } from "lucide-react";

interface LyricsDisplayProps {
  trackName: string;
  artistName: string;
  currentTime: number;
}

export default function LyricsDisplay({ trackName, artistName, currentTime }: LyricsDisplayProps) {
  const [lyrics, setLyrics] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyright, setCopyright] = useState<string>("");

  useEffect(() => {
    if (trackName && artistName) {
      fetchLyrics(trackName, artistName);
    } else {
      setLyrics("");
      setError(null);
    }
  }, [trackName, artistName]);

  const fetchLyrics = async (track: string, artist: string) => {
    setLoading(true);
    setError(null);
    setLyrics("");

    console.log(`Fetching lyrics for: ${artist} - ${track}`);

    try {
      const response = await fetch(
        `/api/lyrics?track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Lyrics API error:", data);
        throw new Error(data.error || "Failed to fetch lyrics");
      }

      console.log("Lyrics fetched successfully");
      setLyrics(data.lyrics || "");
      setCopyright(data.copyright || "");
    } catch (err) {
      console.error("Error fetching lyrics:", err);
      setError(err instanceof Error ? err.message : "Failed to load lyrics");
      setLyrics("");
    } finally {
      setLoading(false);
    }
  };

  if (!trackName || !artistName) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg text-center text-gray-400">
        <Music size={48} className="mx-auto mb-4 opacity-50" />
        <p>Select a song to view lyrics</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg text-center">
        <Loader2 size={48} className="mx-auto animate-spin text-blue-500" />
        <p className="mt-4 text-gray-400">Loading lyrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg text-center">
        <p className="text-red-400 mb-2">Error loading lyrics</p>
        <p className="text-sm text-gray-400">{error}</p>
      </div>
    );
  }

  if (!lyrics) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg text-center text-gray-400">
        <p>Lyrics not available for this track</p>
      </div>
    );
  }

  // Split lyrics into lines for better display
  const lyricsLines = lyrics.split("\n").filter((line) => line.trim() !== "");

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2 text-white">Lyrics</h2>
        <p className="text-sm text-gray-400">
          {trackName} by {artistName}
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-2 text-center">
          {lyricsLines.map((line, index) => (
            <p
              key={index}
              className="text-lg leading-relaxed text-gray-200"
              style={{
                opacity: currentTime > 0 ? 0.7 : 1,
                fontWeight: currentTime > 0 ? "normal" : "normal",
              }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {copyright && (
        <p className="mt-4 text-xs text-gray-500 text-center">{copyright}</p>
      )}
    </div>
  );
}
