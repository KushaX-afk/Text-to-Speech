import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Check,
  FastForward,
  Rewind,
  Music2,
  Gauge,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { AudioClip, ToneOption } from '../types';
import WaveformVisualizer from './WaveformVisualizer';
import { convertWavToMp3Blob } from '../utils/mp3Encoder';

interface AudioPlayerProps {
  clip: AudioClip | null;
  isLoading: boolean;
  selectedTone?: ToneOption;
  theme?: 'dark' | 'light';
}

export default function AudioPlayer({
  clip,
  isLoading,
  selectedTone,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isConvertingMp3, setIsConvertingMp3] = useState(false);

  // Initialize Web Audio EQ filters
  useEffect(() => {
    if (!audioRef.current) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioContextRef.current = new AudioCtx();
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Update EQ whenever selectedTone changes
  useEffect(() => {
    if (!selectedTone) return;
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = selectedTone.bassBoost;
    }
    if (trebleFilterRef.current) {
      trebleFilterRef.current.gain.value = selectedTone.trebleBoost;
    }
  }, [selectedTone]);

  useEffect(() => {
    if (clip?.audioUrl && audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [clip]);

  const togglePlayPause = () => {
    if (!audioRef.current || !clip) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error('Play error', e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || clip?.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const nextTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
    }
  };

  const handleSpeedSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleSpeedPreset = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleDownloadWav = () => {
    if (!clip?.audioUrl) return;
    const a = document.createElement('a');
    a.href = clip.audioUrl;
    const cleanVoice = clip.voiceName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    a.download = `speech_${cleanVoice}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadMp3 = async () => {
    if (!clip?.audioUrl || isConvertingMp3) return;
    setIsConvertingMp3(true);
    try {
      const mp3Blob = await convertWavToMp3Blob(clip.audioUrl);
      const url = URL.createObjectURL(mp3Blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanVoice = clip.voiceName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.download = `speech_${cleanVoice}_${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('MP3 conversion error:', err);
      // Fallback to WAV download if conversion fails
      handleDownloadWav();
    } finally {
      setIsConvertingMp3(false);
    }
  };

  const handleCopyText = async () => {
    if (!clip?.text) return;
    try {
      await navigator.clipboard.writeText(clip.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      id="speech-player-container"
      className="bg-gray-900/90 dark:bg-gray-900/90 bg-white/95 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-gray-800/80 dark:border-gray-800/80 border-gray-200/90 shadow-2xl shadow-indigo-950/20 dark:shadow-indigo-950/40 light:shadow-indigo-100/40 relative overflow-hidden transition-all duration-300"
    >
      <audio
        ref={audioRef}
        src={clip?.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />

      {/* Top Header Information & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-800/80 dark:border-gray-800/80 border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/10 bg-indigo-50 border border-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                Studio Master Output
              </h3>
              {clip ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                    {clip.voiceName}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    {clip.style || 'Natural'}
                  </span>
                  {selectedTone && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                      {selectedTone.label}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  Ready to Synthesize
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {clip
                ? `${clip.text.length} chars • Lossless studio audio playback`
                : 'Enter your text below and click synthesize to hear speech'}
            </p>
          </div>
        </div>

        {clip && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="copy-speech-text-btn"
              onClick={handleCopyText}
              title="Copy text"
              className="px-3 py-1.5 rounded-xl text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            {/* MP3 Download Button */}
            <button
              id="download-mp3-btn"
              onClick={handleDownloadMp3}
              disabled={isConvertingMp3}
              title="Download compressed MP3 audio (Universal)"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-98 disabled:opacity-50"
            >
              {isConvertingMp3 ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isConvertingMp3 ? 'Encoding MP3...' : 'Download MP3'}</span>
            </button>

            {/* WAV Download Button */}
            <button
              id="download-wav-btn"
              onClick={handleDownloadWav}
              title="Download uncompressed 24kHz WAV Master"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>WAV</span>
            </button>
          </div>
        )}
      </div>

      {/* Waveform Visualization Canvas */}
      <div className="mb-4">
        <WaveformVisualizer
          isPlaying={isPlaying}
          audioElement={audioRef.current}
        />
      </div>

      {/* Time Progress & Seek Bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-mono">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatTime(currentTime)}</span>
          <span>{formatTime(duration || clip?.duration || 0)}</span>
        </div>
        <div className="relative flex items-center">
          <input
            id="audio-scrub-slider"
            type="range"
            min={0}
            max={duration || clip?.duration || 100}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            disabled={!clip}
            className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full appearance-none cursor-pointer accent-indigo-600 disabled:opacity-30 focus:outline-none"
          />
        </div>
      </div>

      {/* Playback Controls & Continuous Speed Slider */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Speed Slider Section */}
        <div className="flex items-center gap-2.5 bg-gray-100 dark:bg-gray-950/80 px-3.5 py-2 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <Gauge className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono w-10 text-right">{playbackRate.toFixed(2)}x</span>
          </div>

          <input
            id="speed-slider"
            type="range"
            min={0.5}
            max={2.0}
            step={0.05}
            value={playbackRate}
            onChange={handleSpeedSliderChange}
            disabled={!clip}
            title="Adjust voice playback speed"
            className="w-20 sm:w-28 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
          />

          {/* Quick preset buttons */}
          <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-gray-300 dark:border-gray-700">
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                id={`speed-btn-${rate}x`}
                type="button"
                onClick={() => handleSpeedPreset(rate)}
                disabled={!clip}
                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono transition-all ${
                  Math.abs(playbackRate - rate) < 0.01
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                } disabled:opacity-30`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="skip-backward-5s-btn"
            onClick={() => handleSkip(-5)}
            disabled={!clip}
            title="Rewind 5s"
            className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all disabled:opacity-30 border border-gray-200 dark:border-gray-700/50"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            id="play-pause-master-btn"
            onClick={togglePlayPause}
            disabled={!clip || isLoading}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-3xl flex items-center justify-center transition-all ${
              clip
                ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/35 active:scale-95'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-300 dark:border-gray-700/50'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            id="skip-forward-5s-btn"
            onClick={() => handleSkip(5)}
            disabled={!clip}
            title="Skip forward 5s"
            className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all disabled:opacity-30 border border-gray-200 dark:border-gray-700/50"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            id="restart-audio-btn"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play();
                setIsPlaying(true);
              }
            }}
            disabled={!clip}
            title="Replay from start"
            className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-all disabled:opacity-30 border border-gray-200 dark:border-gray-700/50"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Volume slider & mute toggle */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-950/80 px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-800">
          <button
            id="mute-toggle-btn"
            onClick={toggleMute}
            disabled={!clip}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            id="volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            disabled={!clip}
            className="w-16 sm:w-20 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
          />
        </div>
      </div>
    </div>
  );
}
