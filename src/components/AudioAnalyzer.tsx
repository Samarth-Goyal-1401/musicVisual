"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Sparkles, Music } from "lucide-react";

interface AnalysisSection {
  title: string;
  content: any;
  color: string;
}

interface AudioAnalyzerProps {
  videoId: string;
  title: string;
  isPlaying: boolean;
  currentTime: number;
}

export default function AudioAnalyzer({ videoId, title, isPlaying, currentTime }: AudioAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const analyzeQuery = async () => {
    if (!query.trim()) {
      setError("Please enter a question about the music");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/spotify-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          title,
          query
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      console.log("Spotify analysis complete:", data.analysis);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getColorForSection = (title: string) => {
    const colors: { [key: string]: string } = {
      'OVERALL VIBE & MOOD': 'from-purple-500 to-pink-500',
      'CHARACTER DEVELOPMENT & BACKGROUND': 'from-blue-500 to-cyan-500',
      'SCENE & SETTING': 'from-green-500 to-emerald-500',
      'COLOR PALETTE & VISUAL THEMES': 'from-orange-500 to-red-500',
      'VISUAL STYLE & ANIMATION DIRECTION': 'from-indigo-500 to-purple-500',
      'EMOTIONAL PROGRESSION WITH TIMESTAMPS': 'from-pink-500 to-rose-500',
      'INSTRUMENTATION & MUSICAL ELEMENTS': 'from-yellow-500 to-orange-500',
    };
    return colors[title] || 'from-gray-500 to-gray-600';
  };

  const renderAnalysisSection = (section: AnalysisSection) => (
    <div className={`bg-gradient-to-r ${section.color} p-6 rounded-lg shadow-lg border border-white/20`}>
      <h3 className="text-lg font-bold text-white mb-4">{section.title}</h3>
      <div className="text-white/90 space-y-2">
        {typeof section.content === 'object' ? (
          Object.entries(section.content).map(([key, value]) => (
            <div key={key} className="ml-4">
              <p className="font-semibold text-white/80">{key}:</p>
              <p className="text-white/70">{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</p>
            </div>
          ))
        ) : (
          <p className="text-white/80">{section.content}</p>
        )}
      </div>
    </div>
  );

  if (!isPlaying && !analysis) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg text-center">
        <Music size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-gray-400">Play the song and click "Analyze Audio" to generate visual animations</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Query Input */}
      <div className="bg-[#212121] p-6 rounded-lg shadow-lg">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-2">Ask Gemini AI About Music</h2>
          <p className="text-gray-400">Ask any question about music, visuals, or animation ideas</p>
        </div>
        
        {/* Query Input */}
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about mood, characters, colors, animations..."
            className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-[#333333] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={analyzeQuery}
            disabled={isAnalyzing || !query.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {/* Direct Gemini Link */}
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-white mb-2">Alternative: Direct Gemini Analysis</h3>
        <p className="text-gray-400 mb-4">Having trouble with audio analysis? Try Gemini directly:</p>
        <a 
          href={`https://aistudio.google.com/?apiKey=${process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyDFRVwSdC9HgHiDWu06M_90Zyazy4UOoaw'}&videoId=${videoId}&title=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          Open Gemini AI Analysis
        </a>
        <p className="text-sm text-gray-300 mt-2">
          No audio processing required - just ask questions directly!
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isAnalyzing && (
        <div className="space-y-6">
          {typeof analysis === 'object' && !analysis.error ? (
            Object.entries(analysis).map(([sectionTitle, content]) => (
              <div key={sectionTitle}>
                {renderAnalysisSection({
                  title: sectionTitle,
                  content,
                  color: getColorForSection(sectionTitle)
                })}
              </div>
            ))
          ) : (
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6 rounded-lg shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4">Analysis Result</h3>
              <div className="text-white/80">
                <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(analysis, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
