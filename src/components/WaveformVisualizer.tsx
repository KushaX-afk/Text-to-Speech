import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
  barCount?: number;
}

export default function WaveformVisualizer({
  isPlaying,
  audioElement,
  barCount = 56,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    if (!audioElement) return;

    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }

      const ctx = audioContextRef.current;
      if (ctx && !sourceRef.current) {
        try {
          analyserRef.current = ctx.createAnalyser();
          analyserRef.current.fftSize = 256;
          sourceRef.current = ctx.createMediaElementSource(audioElement);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(ctx.destination);
        } catch (e) {
          console.warn('Web Audio node connection warning:', e);
        }
      }
    } catch (err) {
      console.warn('Web Audio API initialized with simulated visualizer', err);
    }
  }, [audioElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let dataArray: Uint8Array | null = null;
      if (analyserRef.current && isPlaying) {
        dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
      }

      const barWidth = (width / barCount) * 0.62;
      const gap = (width - barWidth * barCount) / (barCount - 1);

      for (let i = 0; i < barCount; i++) {
        let normalizedHeight = 0.12;

        if (isPlaying) {
          if (dataArray && dataArray.length > 0) {
            const index = Math.floor((i / barCount) * (dataArray.length * 0.75));
            const val = dataArray[index] || 0;
            normalizedHeight = Math.max(0.12, val / 255);
          } else {
            const wave1 = Math.sin(phase + i * 0.24) * 0.35 + 0.5;
            const wave2 = Math.cos(phase * 1.4 + i * 0.16) * 0.22;
            normalizedHeight = Math.max(0.12, Math.min(0.92, wave1 + wave2));
          }
        }

        const barHeight = Math.max(5, normalizedHeight * (height * 0.85));
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, '#c084fc');
          gradient.addColorStop(0.4, '#818cf8');
          gradient.addColorStop(1, '#6366f1');
        } else {
          gradient.addColorStop(0, '#64748b');
          gradient.addColorStop(1, '#334155');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 4);
        ctx.roundRect(x, y, barWidth, barHeight, radius);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.12;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, barCount]);

  return (
    <div className="w-full h-20 sm:h-24 bg-gray-100 dark:bg-gray-950/90 rounded-2xl p-3 border border-gray-200 dark:border-gray-800/80 shadow-inner flex items-center justify-center overflow-hidden relative group">
      {isPlaying && (
        <div className="absolute inset-0 bg-indigo-500/5 blur-xl pointer-events-none rounded-2xl" />
      )}
      <canvas
        ref={canvasRef}
        width={560}
        height={90}
        className="w-full h-full object-contain relative z-10"
      />
    </div>
  );
}
