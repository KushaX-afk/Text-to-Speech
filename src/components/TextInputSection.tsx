import React, { useState } from 'react';
import {
  Trash2,
  Clipboard,
  Loader2,
  Wand2,
  BookOpen,
  Volume2,
} from 'lucide-react';
import { SCRIPT_PRESETS } from '../data/voices';
import { ScriptPreset, VoiceOption, StyleOption } from '../types';

interface TextInputSectionProps {
  text: string;
  onChangeText: (text: string) => void;
  onSynthesize: () => void;
  isLoading: boolean;
  onApplyPreset: (preset: ScriptPreset) => void;
  selectedVoice: VoiceOption;
  selectedStyle: StyleOption;
  isGeneratingScript: boolean;
  onGenerateAiScript: (category: string) => void;
}

export default function TextInputSection({
  text,
  onChangeText,
  onSynthesize,
  isLoading,
  onApplyPreset,
  selectedVoice,
  isGeneratingScript,
  onGenerateAiScript,
}: TextInputSectionProps) {
  const [showAiMenu, setShowAiMenu] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const estimatedSeconds = Math.max(1, Math.round(wordCount / 2.5));

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onChangeText(text ? `${text} ${clipText}` : clipText);
      }
    } catch {
      // ignore
    }
  };

  const handleClear = () => {
    onChangeText('');
  };

  return (
    <div className="space-y-3.5">
      {/* Header with Presets & AI Generator */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor="speech-text-input"
          className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 light:text-gray-600 flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-indigo-400" />
          Text to Synthesize
        </label>

        <div className="flex items-center gap-2 relative">
          {/* AI Scriptwriter dropdown */}
          <div className="relative">
            <button
              type="button"
              id="ai-script-generator-btn"
              onClick={() => setShowAiMenu(!showAiMenu)}
              disabled={isGeneratingScript || isLoading}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 hover:from-indigo-500/30 hover:to-pink-500/30 text-indigo-600 dark:text-indigo-200 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-98"
            >
              {isGeneratingScript ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              )}
              <span>{isGeneratingScript ? 'Writing...' : '✨ AI Scriptwriter'}</span>
            </button>

            {showAiMenu && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/80 rounded-2xl shadow-2xl p-2 z-30 space-y-1 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/10">
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 px-2.5 py-1 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  Generate Instant Voiceover
                </div>
                {[
                  { id: 'meditation', label: '🧘 Guided Meditation', desc: 'Calm breathing mindfulness' },
                  { id: 'story', label: '📖 Fantasy Audiobook Hook', desc: 'Dramatic narrative opener' },
                  { id: 'news', label: '📰 Tech Breaking Bulletin', desc: 'Crisp professional report' },
                  { id: 'commercial', label: '🚀 Radio Commercial Ad', desc: 'High-energy hook' },
                  { id: 'podcast', label: '🎙️ Podcast Welcome Intro', desc: 'Warm host greeting' },
                  { id: 'sci_fi', label: '🛸 Sci-Fi Spaceship Alert', desc: 'Atmospheric AI alert' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setShowAiMenu(false);
                      onGenerateAiScript(cat.id);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 text-xs text-gray-800 dark:text-gray-200 transition-colors flex flex-col group"
                  >
                    <span className="font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      {cat.label}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{cat.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            id="paste-text-btn"
            onClick={handlePaste}
            title="Paste from clipboard"
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs flex items-center gap-1 border border-gray-200 dark:border-gray-800 transition-colors"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paste</span>
          </button>

          {text && (
            <button
              type="button"
              id="clear-text-btn"
              onClick={handleClear}
              title="Clear text"
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs flex items-center gap-1 border border-gray-200 dark:border-gray-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0 font-medium mr-1">Quick Presets:</span>
        {SCRIPT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            id={`preset-btn-${preset.id}`}
            onClick={() => onApplyPreset(preset)}
            className="shrink-0 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-900/80 hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold transition-all"
          >
            {preset.title}
          </button>
        ))}
      </div>

      {/* Rounded Text Area */}
      <div className="relative">
        <textarea
          id="speech-text-input"
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Type or paste any text you want spoken aloud... (e.g. Welcome to the future of voice technology. Everything you hear is synthesized with pure AI clarity.)"
          rows={6}
          className="w-full bg-gray-50 dark:bg-gray-950/80 border border-gray-200 dark:border-gray-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 rounded-3xl p-5 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base leading-relaxed resize-y outline-none transition-all shadow-inner font-normal"
        />

        {/* Floating Bottom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="bg-gray-100 dark:bg-gray-900/80 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-800">
              <strong className="text-gray-800 dark:text-gray-200">{charCount}</strong> chars
            </span>
            <span className="bg-gray-100 dark:bg-gray-900/80 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-gray-800">
              <strong className="text-gray-800 dark:text-gray-200">{wordCount}</strong> words
            </span>
            {wordCount > 0 && (
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                ~{estimatedSeconds}s spoken
              </span>
            )}
          </div>

          <div>
            <button
              type="button"
              id="synthesize-speech-btn"
              onClick={onSynthesize}
              disabled={isLoading || !text.trim()}
              className={`px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 transition-all shadow-xl ${
                !text.trim() || isLoading
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/35 hover:shadow-indigo-600/50 active:scale-98 ring-1 ring-white/10'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Voice...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 fill-current" />
                  <span>Speak Aloud ({selectedVoice.name})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
