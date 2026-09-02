import React, { useState } from 'react';
import {
  History,
  Play,
  Download,
  Trash2,
  Clock,
  Users,
  Loader2,
  FileAudio,
} from 'lucide-react';
import { AudioClip } from '../types';
import { convertWavToMp3Blob } from '../utils/mp3Encoder';

interface ClipHistoryProps {
  history: AudioClip[];
  activeClipId: string | undefined;
  onSelectClip: (clip: AudioClip) => void;
  onDeleteClip: (id: string) => void;
  onClearHistory: () => void;
}

export default function ClipHistory({
  history,
  activeClipId,
  onSelectClip,
  onDeleteClip,
  onClearHistory,
}: ClipHistoryProps) {
  const [convertingId, setConvertingId] = useState<string | null>(null);

  if (history.length === 0) {
    return null;
  }

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDownloadMp3 = async (clip: AudioClip, e: React.MouseEvent) => {
    e.stopPropagation();
    if (convertingId) return;
    setConvertingId(clip.id);

    try {
      const mp3Blob = await convertWavToMp3Blob(clip.audioUrl);
      const url = URL.createObjectURL(mp3Blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanVoice = clip.voiceName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.download = `speech_${cleanVoice}_${clip.id}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('Failed to convert clip to MP3:', err);
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-3.5 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 light:text-gray-600 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          Recent Synthesized Clips ({history.length})
        </label>
        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs text-gray-400 dark:text-gray-400 light:text-gray-500 hover:text-rose-400 transition-colors"
        >
          Clear History
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {history.map((item) => {
          const isActive = activeClipId === item.id;
          const isConverting = convertingId === item.id;

          return (
            <div
              key={item.id}
              id={`history-item-${item.id}`}
              onClick={() => onSelectClip(item)}
              className={`p-4 rounded-3xl border text-left cursor-pointer transition-all duration-200 ${
                isActive
                  ? 'bg-gray-800/90 dark:bg-gray-800/90 bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg'
                  : 'bg-gray-900/60 dark:bg-gray-900/60 bg-white hover:bg-gray-800/60 dark:hover:bg-gray-800/60 light:hover:bg-gray-50 border-gray-800 dark:border-gray-800 light:border-gray-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-indigo-400 dark:text-indigo-300 light:text-indigo-700">
                    {item.voiceName}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 dark:bg-gray-800 light:bg-gray-100 text-gray-300 dark:text-gray-300 light:text-gray-700 border border-gray-700 dark:border-gray-700 light:border-gray-200 font-medium">
                    {item.style || 'Natural'}
                  </span>
                  {item.mode === 'multi' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-medium">
                      <Users className="w-2.5 h-2.5" /> Dialogue
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimestamp(item.createdAt)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-300 dark:text-gray-300 light:text-gray-700 line-clamp-2 mb-3 leading-relaxed">
                "{item.text}"
              </p>

              <div className="flex items-center justify-between pt-2.5 border-t border-gray-800/80 dark:border-gray-800/80 light:border-gray-200">
                <span className="text-[10px] font-mono text-gray-400 font-medium">
                  {formatDuration(item.duration)} duration
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClip(item);
                    }}
                    title="Play clip"
                    className="p-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 dark:text-indigo-300 light:text-indigo-700 text-xs transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDownloadMp3(item, e)}
                    disabled={isConverting}
                    title="Download as MP3"
                    className="px-2 py-1 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 dark:text-emerald-300 light:text-emerald-700 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {isConverting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <FileAudio className="w-3 h-3" />
                    )}
                    <span>MP3</span>
                  </button>

                  <a
                    href={item.audioUrl}
                    download={`speech_${item.voiceName.toLowerCase()}_${item.id}.wav`}
                    onClick={(e) => e.stopPropagation()}
                    title="Download as WAV"
                    className="p-1.5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-700 light:hover:bg-gray-200 text-gray-400 hover:text-gray-200 light:hover:text-gray-900 transition-colors text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClip(item.id);
                    }}
                    title="Delete clip"
                    className="p-1.5 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-700 light:hover:bg-gray-200 text-gray-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
