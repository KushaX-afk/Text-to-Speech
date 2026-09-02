import React from 'react';
import { Sliders, Sparkles, Coffee, Layers, Radio, Volume2 } from 'lucide-react';
import { ToneOption } from '../types';
import { TONE_OPTIONS } from '../data/voices';

interface ToneSelectorProps {
  selectedTone: ToneOption;
  onSelectTone: (tone: ToneOption) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Volume2: <Volume2 className="w-3.5 h-3.5" />,
  Coffee: <Coffee className="w-3.5 h-3.5" />,
  Layers: <Layers className="w-3.5 h-3.5" />,
  Sparkles: <Sparkles className="w-3.5 h-3.5" />,
  Radio: <Radio className="w-3.5 h-3.5" />,
};

export default function ToneSelector({ selectedTone, onSelectTone }: ToneSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 light:text-gray-600 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Acoustic Tone & Equalization
        </label>
        <span className="text-xs text-gray-400">
          Tone: <strong className="text-cyan-300 font-semibold">{selectedTone.label}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {TONE_OPTIONS.map((tone) => {
          const isSelected = selectedTone.id === tone.id;
          return (
            <button
              key={tone.id}
              type="button"
              id={`tone-toggle-${tone.id}`}
              onClick={() => onSelectTone(tone)}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/40 dark:bg-cyan-950/40 light:bg-cyan-50 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-gray-900/40 dark:bg-gray-900/50 light:bg-gray-100/70 hover:bg-gray-800/40 border-gray-800/80 dark:border-gray-800/80 light:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className={`p-1.5 rounded-xl ${
                    isSelected
                      ? 'bg-cyan-500 text-white shadow-xs'
                      : 'bg-gray-800 text-gray-400 light:bg-gray-200 light:text-gray-600'
                  }`}
                >
                  {ICON_MAP[tone.iconName] || <Volume2 className="w-3.5 h-3.5" />}
                </div>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>

              <div>
                <h6
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-cyan-200 light:text-cyan-900'
                      : 'text-gray-200 dark:text-gray-200 light:text-gray-800'
                  }`}
                >
                  {tone.label}
                </h6>
                <p className="text-[10px] text-gray-400 light:text-gray-500 line-clamp-1 mt-0.5">
                  {tone.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
