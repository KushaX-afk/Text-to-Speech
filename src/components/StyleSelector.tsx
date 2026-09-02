import React from 'react';
import {
  Volume2,
  Sparkles,
  Moon,
  Flame,
  Radio,
  BookOpen,
  Wind,
  Cpu,
  SmilePlus,
} from 'lucide-react';
import { StyleOption } from '../types';
import { STYLES } from '../data/voices';

interface StyleSelectorProps {
  selectedStyle: StyleOption;
  onSelectStyle: (style: StyleOption) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Volume2: <Volume2 className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Moon: <Moon className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Radio: <Radio className="w-4 h-4" />,
  BookOpen: <BookOpen className="w-4 h-4" />,
  Wind: <Wind className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
};

export default function StyleSelector({
  selectedStyle,
  onSelectStyle,
}: StyleSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 light:text-gray-600 flex items-center gap-2">
          <SmilePlus className="w-4 h-4 text-purple-400" />
          Voice Emotion & Cadence Style
        </label>
        <span className="text-xs text-gray-400">
          Delivery: <strong className="text-purple-600 dark:text-purple-300 font-semibold">{selectedStyle.label}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {STYLES.map((style) => {
          const isSelected = selectedStyle.id === style.id;
          return (
            <button
              key={style.id}
              type="button"
              id={`style-btn-${style.id}`}
              onClick={() => onSelectStyle(style)}
              className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-purple-50 dark:bg-gradient-to-b dark:from-purple-950/50 dark:to-gray-900 border-purple-500 shadow-md shadow-purple-950/20 ring-1 ring-purple-500/50'
                  : 'bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-gray-200 dark:border-gray-800/90'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {ICON_MAP[style.iconName] || <Volume2 className="w-4 h-4" />}
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse shadow-xs" />
                )}
              </div>

              <div>
                <h5
                  className={`text-xs font-bold ${
                    isSelected
                      ? 'text-purple-900 dark:text-white'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {style.label}
                </h5>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                  {style.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
