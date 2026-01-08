"use client";

import { useState } from "react";
import { Copy, Loader2, Brain } from "lucide-react";

interface SongAnalysisProps {
  analysis: string | null;
  isLoading: boolean;
}

export default function SongAnalysis({ analysis, isLoading }: SongAnalysisProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (analysis) {
      try {
        await navigator.clipboard.writeText(analysis);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-[#212121] rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={32} className="animate-spin text-blue-500 mr-3" />
          <Brain size={32} className="text-blue-500" />
          <p className="ml-3 text-gray-400">Analyzing music...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-6">
      <div className="bg-[#212121] border border-[#303030] rounded-lg shadow-lg">
        {/* Header with copy button */}
        <div className="flex justify-between items-center p-4 border-b border-[#303030]">
          <h3 className="text-lg font-semibold text-white">Song Analysis</h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1 bg-[#272727] hover:bg-[#3d3d3d] text-gray-300 rounded-md transition-colors border border-[#303030]"
          >
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        {/* Analysis content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            {analysis.split('\n\n').map((paragraph, index) => {
              // Clean markdown symbols
              const cleanText = paragraph.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
              
              // Check if this is a header line (contains ":")
              if (cleanText.includes(':') && cleanText.length < 100) {
                return (
                  <h4 key={index} className="text-lg font-semibold text-blue-400 mb-3 mt-4">
                    {cleanText}
                  </h4>
                );
              }
              
              // Check if this is a bullet point list
              if (paragraph.includes('•') || paragraph.includes('-') || paragraph.startsWith('*')) {
                return (
                  <ul key={index} className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                    {paragraph.split('\n').map((line, lineIndex) => {
                      const cleanedLine = line.replace(/^[•\-\s*]+\s*/, '').replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '');
                      return cleanedLine ? (
                        <li key={lineIndex} className="text-gray-300 leading-relaxed">
                          {cleanedLine}
                        </li>
                      ) : null;
                    })}
                  </ul>
                );
              }
              
              // Regular paragraph
              return (
                <p key={index} className="text-gray-300 leading-relaxed mb-4">
                  {cleanText}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
