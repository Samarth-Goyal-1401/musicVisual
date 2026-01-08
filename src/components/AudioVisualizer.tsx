"use client";

import { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null;
}

export default function AudioVisualizer({ isPlaying, audioElement }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize audio context if playing
    if (isPlaying && audioElement) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaElementSource(audioElement);

        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        analyser.connect(audioContext.destination);

        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = dataArray;
      } catch (error) {
        console.error("Error initializing audio context:", error);
      }
    }

    // Animation function
    const draw = () => {
      if (!ctx || !analyserRef.current || !dataArrayRef.current) {
        // Fallback visualization when audio context is not available
        ctx.fillStyle = "rgb(59, 130, 246)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      ctx.fillStyle = "rgb(17, 24, 39)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArrayRef.current.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        barHeight = (dataArrayRef.current[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, "rgb(59, 130, 246)");
        gradient.addColorStop(0.5, "rgb(147, 51, 234)");
        gradient.addColorStop(1, "rgb(236, 72, 153)");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying) {
      draw();
    } else {
      // Clear canvas when not playing
      ctx.fillStyle = "rgb(17, 24, 39)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isPlaying, audioElement]);

  return (
    <div className="w-full h-48 bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: "block" }}
      />
    </div>
  );
}
