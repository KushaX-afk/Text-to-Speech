import React from 'react';
import {
  Users,
  Plus,
  Trash2,
  Volume2,
  Loader2,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { DialogueLine, VoiceOption } from '../types';
import { VOICES } from '../data/voices';

interface DialogueModeProps {
  lines: DialogueLine[];
  onChangeLines: (lines: DialogueLine[]) => void;
  onSynthesizeDialogue: () => void;
  isLoading: boolean;
  speaker1Voice: VoiceOption;
  speaker2Voice: VoiceOption;
  onSelectSpeaker1Voice: (voice: VoiceOption) => void;
  onSelectSpeaker2Voice: (voice: VoiceOption) => void;
}

export default function DialogueMode({
  lines,
  onChangeLines,
  onSynthesizeDialogue,
  isLoading,
  speaker1Voice,
  speaker2Voice,
  onSelectSpeaker1Voice,
  onSelectSpeaker2Voice,
}: DialogueModeProps) {
  const handleAddLine = (speaker: 'Speaker A' | 'Speaker B') => {
    const defaultVoice = speaker === 'Speaker A' ? speaker1Voice.geminiVoice : speaker2Voice.geminiVoice;
    onChangeLines([
      ...lines,
      {
        id: `line-${Date.now()}-${Math.random()}`,
        speaker,
        voiceName: defaultVoice,
        text: '',
      },
    ]);
  };

  const handleUpdateLineText = (id: string, text: string) => {
    onChangeLines(lines.map((l) => (l.id === id ? { ...l, text } : l)));
  };

  const handleToggleSpeaker = (id: string) => {
    onChangeLines(
      lines.map((l) => {
        if (l.id === id) {
          const nextSpeaker = l.speaker === 'Speaker A' ? 'Speaker B' : 'Speaker A';
          const nextVoice =
            nextSpeaker === 'Speaker A' ? speaker1Voice.geminiVoice : speaker2Voice.geminiVoice;
          return { ...l, speaker: nextSpeaker, voiceName: nextVoice };
        }
        return l;
      })
    );
  };

  const handleDeleteLine = (id: string) => {
    if (lines.length <= 1) return;
    onChangeLines(lines.filter((l) => l.id !== id));
  };

  const handleLoadSampleDialogue = () => {
    onChangeLines([
      {
        id: '1',
        speaker: 'Speaker A',
        voiceName: speaker1Voice.geminiVoice,
        text: 'Did you hear about the new neural acoustic breakthrough in voice synthesis?',
      },
      {
        id: '2',
        speaker: 'Speaker B',
        voiceName: speaker2Voice.geminiVoice,
        text: 'Yes! It seamlessly captures real-time emotion, cadence, and conversational timing.',
      },
      {
        id: '3',
        speaker: 'Speaker A',
        voiceName: speaker1Voice.geminiVoice,
        text: 'The possibilities for interactive storytelling and educational tutorials are virtually limitless.',
      },
    ]);
  };

  const totalWords = lines.reduce((acc, l) => acc + (l.text.trim() ? l.text.trim().split(/\s+/).length : 0), 0);

  return (
    <div className="space-y-4">
      {/* Speaker Configuration Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-950/80 rounded-3xl border border-gray-200 dark:border-gray-800">
        {/* Speaker A Config */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-600/30 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center justify-center text-sm shadow-xs">
              A
            </div>
            <div>
              <h5 className="text-xs font-bold text-gray-900 dark:text-gray-200">Speaker A</h5>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{speaker1Voice.name} ({speaker1Voice.gender})</p>
            </div>
          </div>
          <select
            id="speaker-a-voice-select"
            value={speaker1Voice.id}
            onChange={(e) => {
              const v = VOICES.find((voice) => voice.id === e.target.value);
              if (v) onSelectSpeaker1Voice(v);
            }}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-indigo-500 cursor-pointer font-semibold"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender})
              </option>
            ))}
          </select>
        </div>

        {/* Speaker B Config */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-extrabold flex items-center justify-center text-sm shadow-xs">
              B
            </div>
            <div>
              <h5 className="text-xs font-bold text-gray-900 dark:text-gray-200">Speaker B</h5>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{speaker2Voice.name} ({speaker2Voice.gender})</p>
            </div>
          </div>
          <select
            id="speaker-b-voice-select"
            value={speaker2Voice.id}
            onChange={(e) => {
              const v = VOICES.find((voice) => voice.id === e.target.value);
              if (v) onSelectSpeaker2Voice(v);
            }}
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500 cursor-pointer font-semibold"
          >
            {VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.gender})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dialogue Lines List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400 light:text-gray-600 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Dialogue Script ({lines.length} lines • {totalWords} words)
          </label>
          <button
            type="button"
            onClick={handleLoadSampleDialogue}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample Conversation</span>
          </button>
        </div>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {lines.map((line, idx) => {
            const isSpeakerA = line.speaker === 'Speaker A';
            return (
              <div
                key={line.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3.5 transition-all ${
                  isSpeakerA
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/60 shadow-xs'
                    : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggleSpeaker(line.id)}
                  title="Click to switch speaker"
                  className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs border transition-all ${
                    isSpeakerA
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-emerald-600 text-white shadow-xs'
                  }`}
                >
                  {isSpeakerA ? 'A' : 'B'}
                </button>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${isSpeakerA ? 'text-indigo-800 dark:text-indigo-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                      {line.speaker} ({isSpeakerA ? speaker1Voice.name : speaker2Voice.name})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleSpeaker(line.id)}
                      className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Switch Speaker</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    id={`dialogue-line-input-${idx}`}
                    value={line.text}
                    onChange={(e) => handleUpdateLineText(line.id, e.target.value)}
                    placeholder={
                      isSpeakerA
                        ? `What should ${speaker1Voice.name} say?`
                        : `What should ${speaker2Voice.name} reply?`
                    }
                    className="w-full bg-white dark:bg-gray-950/90 border border-gray-200 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:border-indigo-500 transition-colors shadow-2xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteLine(line.id)}
                  disabled={lines.length <= 1}
                  title="Delete line"
                  className="shrink-0 p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="add-speaker-a-line-btn"
              onClick={() => handleAddLine('Speaker A')}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Speaker A ({speaker1Voice.name})</span>
            </button>
            <button
              type="button"
              id="add-speaker-b-line-btn"
              onClick={() => handleAddLine('Speaker B')}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Speaker B ({speaker2Voice.name})</span>
            </button>
          </div>

          <button
            type="button"
            id="synthesize-dialogue-btn"
            onClick={onSynthesizeDialogue}
            disabled={isLoading || lines.every((l) => !l.text.trim())}
            className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all shadow-xl ${
              isLoading || lines.every((l) => !l.text.trim())
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white shadow-indigo-600/35 active:scale-98'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Dialogue...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 fill-current" />
                <span>Synthesize Conversation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
