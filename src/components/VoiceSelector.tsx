import React from 'react';
import { Check, Play, Square, Mic2 } from 'lucide-react';
import { VoiceOption } from '../types';
import { VOICES } from '../data/voices';

interface VoiceSelectorProps {
  selectedVoice: VoiceOption;
  onSelectVoice: (voice: VoiceOption) => void;
  onPreviewVoiceSample?: (voice: VoiceOption) => void;
  previewingVoiceId?: string | null;
}

export default function VoiceSelector({
  selectedVoice,
  onSelectVoice,
  onPreviewVoiceSample,
  previewingVoiceId,
}: VoiceSelectorProps) {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 light:text-gray-600 flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-indigo-400" />
          Select Voice Persona
        </label>
        <span className="text-xs text-gray-400">
          Active: <strong className="text-indigo-600 dark:text-indigo-300 font-semibold">{selectedVoice.name}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {VOICES.map((voice) => {
          const isSelected = selectedVoice.id === voice.id;
          const isPreviewing = previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              id={`voice-card-${voice.id}`}
              onClick={() => onSelectVoice(voice)}
              className={`group relative p-4 rounded-3xl border text-left cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-indigo-50/90 dark:bg-gradient-to-b dark:from-indigo-950/80 dark:to-gray-900/90 border-indigo-500 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-950/60 ring-2 ring-indigo-500/40'
                  : 'bg-white/80 dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-800/60 border-gray-200 dark:border-gray-800/90'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${voice.avatarColor} flex items-center justify-center text-white font-extrabold text-sm shadow-md ring-1 ring-white/20`}
                  >
                    {voice.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                        {voice.name}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 font-medium">
                        {voice.gender}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                      {voice.tone}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/50">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors" />
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                {voice.description}
              </p>

              {/* Tags & Preview */}
              <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 dark:border-gray-800/80">
                <div className="flex flex-wrap gap-1">
                  {voice.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {onPreviewVoiceSample && (
                  <button
                    type="button"
                    id={`preview-voice-btn-${voice.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewVoiceSample(voice);
                    }}
                    title="Quick sample preview"
                    className={`text-[11px] px-2.5 py-1 rounded-xl flex items-center gap-1.5 font-semibold transition-all ${
                      isPreviewing
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 animate-pulse'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {isPreviewing ? (
                      <>
                        <Square className="w-2.5 h-2.5 fill-current" />
                        <span>Playing</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Preview</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
