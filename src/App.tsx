import React, { useEffect, useState } from 'react';
import {
  Mic,
  Users,
  AlertCircle,
  AudioWaveform,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  Volume2,
} from 'lucide-react';
import { VoiceOption, StyleOption, ToneOption, AudioClip, DialogueLine, ScriptPreset, ThemeMode } from './types';
import { VOICES, STYLES, TONE_OPTIONS } from './data/voices';
import VoiceSelector from './components/VoiceSelector';
import StyleSelector from './components/StyleSelector';
import ToneSelector from './components/ToneSelector';
import TextInputSection from './components/TextInputSection';
import AudioPlayer from './components/AudioPlayer';
import DialogueMode from './components/DialogueMode';
import ClipHistory from './components/ClipHistory';

const LOCAL_STORAGE_KEY = 'tts_clip_history_v1';
const THEME_STORAGE_KEY = 'tts_theme_preference';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [activeTab, setActiveTab] = useState<'single' | 'multi'>('single');
  const [text, setText] = useState(
    'Welcome to Text to Speech Studio. Type any text, choose your preferred voice, cadence, and tone, and experience ultra-realistic speech synthesis in seconds.'
  );
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICES[0]);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption>(STYLES[0]);
  const [selectedTone, setSelectedTone] = useState<ToneOption>(TONE_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentClip, setCurrentClip] = useState<AudioClip | null>(null);
  const [history, setHistory] = useState<AudioClip[]>([]);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Multi-speaker dialogue states
  const [speaker1Voice, setSpeaker1Voice] = useState<VoiceOption>(VOICES[0]); // Kore
  const [speaker2Voice, setSpeaker2Voice] = useState<VoiceOption>(VOICES[1]); // Puck
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>([
    {
      id: '1',
      speaker: 'Speaker A',
      voiceName: 'Kore',
      text: 'Have you experienced the new voice styles and speed controls in this speech engine?',
    },
    {
      id: '2',
      speaker: 'Speaker B',
      voiceName: 'Puck',
      text: 'Yes! The custom acoustic equalization, tone toggles, and instant MP3 export are incredible.',
    },
  ]);

  // Apply theme to document class
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          if (parsed.length > 0 && !currentClip) {
            setCurrentClip(parsed[0]);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const saveToHistory = (clip: AudioClip) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== clip.id);
      const updated = [clip, ...filtered].slice(0, 15);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleSynthesizeSingle = async () => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voiceName: selectedVoice.geminiVoice,
          style: selectedStyle.promptModifier,
          tone: selectedTone.pitchShiftPrompt || '',
          mode: 'single',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to synthesize speech audio.');
      }

      const newClip: AudioClip = {
        id: `clip-${Date.now()}`,
        text: text.trim(),
        voiceName: selectedVoice.name,
        style: selectedStyle.label,
        tone: selectedTone.label,
        audioUrl: data.audioDataUrl,
        duration: data.duration || 0,
        createdAt: Date.now(),
        mode: 'single',
      };

      setCurrentClip(newClip);
      saveToHistory(newClip);
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setError(err?.message || 'Speech generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSynthesizeDialogue = async () => {
    if (dialogueLines.every((l) => !l.text.trim()) || isLoading) return;
    setIsLoading(true);
    setError(null);

    const validLines = dialogueLines.filter((l) => l.text.trim().length > 0);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'multi',
          speakers: validLines.map((l) => ({
            speaker: l.speaker === 'Speaker A' ? speaker1Voice.name : speaker2Voice.name,
            voiceName: l.speaker === 'Speaker A' ? speaker1Voice.geminiVoice : speaker2Voice.geminiVoice,
            text: l.text.trim(),
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to synthesize dialogue audio.');
      }

      const dialogueSummary = validLines
        .map(
          (l) =>
            `${l.speaker === 'Speaker A' ? speaker1Voice.name : speaker2Voice.name}: ${l.text}`
        )
        .join(' | ');

      const newClip: AudioClip = {
        id: `clip-${Date.now()}`,
        text: dialogueSummary,
        voiceName: `${speaker1Voice.name} & ${speaker2Voice.name}`,
        style: 'Dialogue',
        tone: selectedTone.label,
        audioUrl: data.audioDataUrl,
        duration: data.duration || 0,
        createdAt: Date.now(),
        mode: 'multi',
      };

      setCurrentClip(newClip);
      saveToHistory(newClip);
    } catch (err: any) {
      console.error('Dialogue synthesis error:', err);
      setError(err?.message || 'Dialogue generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewVoiceSample = async (voice: VoiceOption) => {
    if (previewingVoiceId) {
      setPreviewingVoiceId(null);
      return;
    }

    setPreviewingVoiceId(voice.id);
    setError(null);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleText,
          voiceName: voice.geminiVoice,
          style: 'normal',
          mode: 'single',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not preview voice.');
      }

      const audio = new Audio(data.audioDataUrl);
      audio.onended = () => setPreviewingVoiceId(null);
      audio.onerror = () => setPreviewingVoiceId(null);
      await audio.play();
    } catch (err: any) {
      console.warn('Preview error:', err);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(voice.sampleText);
        utterance.onend = () => setPreviewingVoiceId(null);
        utterance.onerror = () => setPreviewingVoiceId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setPreviewingVoiceId(null);
      }
    }
  };

  const handleGenerateAiScript = async (category: string) => {
    setIsGeneratingScript(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = await response.json();
      if (response.ok && data.script) {
        setText(data.script);
      }
    } catch (err: any) {
      console.error('Script generation error:', err);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleApplyPreset = (preset: ScriptPreset) => {
    setText(preset.text);
    const matchedVoice = VOICES.find((v) => v.geminiVoice === preset.suggestedVoice);
    if (matchedVoice) setSelectedVoice(matchedVoice);
    const matchedStyle = STYLES.find((s) => s.id === preset.suggestedStyle);
    if (matchedStyle) setSelectedStyle(matchedStyle);
  };

  const handleDeleteClip = (id: string) => {
    setHistory((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    if (currentClip?.id === id) {
      setCurrentClip(null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (activeTab === 'single') {
          handleSynthesizeSingle();
        } else {
          handleSynthesizeDialogue();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, text, selectedVoice, selectedStyle, selectedTone, dialogueLines, isLoading]);

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isDark
          ? 'bg-[#050711] text-gray-100 selection:bg-indigo-500/30 selection:text-indigo-200'
          : 'bg-[#f8fafc] text-gray-900 selection:bg-indigo-100 selection:text-indigo-900'
      } flex flex-col`}
    >
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark ? 'bg-indigo-600/10' : 'bg-indigo-300/20'
          }`}
        />
        <div
          className={`absolute top-1/3 -right-40 w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark ? 'bg-purple-600/10' : 'bg-purple-300/20'
          }`}
        />
        <div
          className={`absolute -bottom-40 left-1/3 w-96 h-96 rounded-full blur-3xl transition-opacity duration-500 ${
            isDark ? 'bg-blue-600/10' : 'bg-blue-300/20'
          }`}
        />
      </div>

      {/* Modern Top Header Navigation Bar */}
      <header
        className={`border-b transition-colors duration-300 sticky top-0 z-40 backdrop-blur-2xl ${
          isDark
            ? 'border-gray-800/80 bg-gray-950/85'
            : 'border-gray-200/90 bg-white/85 shadow-xs'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/20">
              <AudioWaveform className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Text to Speech Studio
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider">
                  24kHz HD
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                AI Voice Synthesis • Tone Adjustments • Speed Controls • MP3 & WAV Export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Mode Switcher Pills */}
            <div
              className={`flex items-center gap-1 p-1 rounded-2xl border ${
                isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-gray-100 border-gray-200'
              }`}
            >
              <button
                id="tab-single-speaker-btn"
                onClick={() => setActiveTab('single')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'single'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Single Speaker</span>
                <span className="sm:hidden">Single</span>
              </button>
              <button
                id="tab-dialogue-mode-btn"
                onClick={() => setActiveTab('multi')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'multi'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dialogue Studio</span>
                <span className="sm:hidden">Dialogue</span>
              </button>
            </div>

            {/* Dark Mode Switch Button */}
            <button
              id="theme-toggle-switch"
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-center cursor-pointer ${
                isDark
                  ? 'bg-gray-900 hover:bg-gray-800 text-amber-300 border-gray-800 shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-indigo-600 border-gray-200 shadow-xs'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 relative z-10">
        {/* Error notification banner */}
        {error && (
          <div className="p-4 rounded-3xl bg-rose-950/50 dark:bg-rose-950/50 bg-rose-50 border border-rose-800/90 dark:border-rose-800/90 border-rose-200 text-rose-800 dark:text-rose-200 text-sm flex items-start gap-3 shadow-xl backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-bold text-rose-700 dark:text-rose-300">Speech Generation Alert</h5>
              <p className="text-xs text-rose-700/90 dark:text-rose-200/90 mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-500 dark:text-rose-400 hover:underline shrink-0 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Master Audio Output Player Section */}
        <section aria-label="Audio Output Player">
          <AudioPlayer
            clip={currentClip}
            isLoading={isLoading}
            selectedTone={selectedTone}
            theme={theme}
          />
        </section>

        {/* Controls Layout */}
        {activeTab === 'single' ? (
          <div className="space-y-6">
            {/* Tone Adjustments Toggles Section */}
            <div
              className={`p-5 rounded-3xl border transition-colors ${
                isDark
                  ? 'bg-gray-900/60 border-gray-800/80 shadow-xs'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
            >
              <ToneSelector
                selectedTone={selectedTone}
                onSelectTone={setSelectedTone}
              />
            </div>

            {/* Input and Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Text Input & Generation */}
              <div
                className={`lg:col-span-7 space-y-5 p-6 rounded-3xl border transition-colors ${
                  isDark
                    ? 'bg-gray-900/60 border-gray-800/80 shadow-xs'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <TextInputSection
                  text={text}
                  onChangeText={setText}
                  onSynthesize={handleSynthesizeSingle}
                  isLoading={isLoading}
                  onApplyPreset={handleApplyPreset}
                  selectedVoice={selectedVoice}
                  selectedStyle={selectedStyle}
                  isGeneratingScript={isGeneratingScript}
                  onGenerateAiScript={handleGenerateAiScript}
                />
              </div>

              {/* Right Column: Style & Voice Persona Selection */}
              <div
                className={`lg:col-span-5 space-y-6 p-6 rounded-3xl border transition-colors ${
                  isDark
                    ? 'bg-gray-900/60 border-gray-800/80 shadow-xs'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <StyleSelector
                  selectedStyle={selectedStyle}
                  onSelectStyle={setSelectedStyle}
                />

                <div
                  className={`border-t pt-5 ${
                    isDark ? 'border-gray-800/80' : 'border-gray-200'
                  }`}
                >
                  <VoiceSelector
                    selectedVoice={selectedVoice}
                    onSelectVoice={setSelectedVoice}
                    onPreviewVoiceSample={handlePreviewVoiceSample}
                    previewingVoiceId={previewingVoiceId}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Dialogue Multi-Speaker Mode */
          <div
            className={`p-6 rounded-3xl border transition-colors ${
              isDark
                ? 'bg-gray-900/60 border-gray-800/80 shadow-xs'
                : 'bg-white border-gray-200 shadow-sm'
            }`}
          >
            <DialogueMode
              lines={dialogueLines}
              onChangeLines={setDialogueLines}
              onSynthesizeDialogue={handleSynthesizeDialogue}
              isLoading={isLoading}
              speaker1Voice={speaker1Voice}
              speaker2Voice={speaker2Voice}
              onSelectSpeaker1Voice={setSpeaker1Voice}
              onSelectSpeaker2Voice={setSpeaker2Voice}
            />
          </div>
        )}

        {/* History of Synthesized Clips */}
        <section aria-label="Clip History">
          <ClipHistory
            history={history}
            activeClipId={currentClip?.id}
            onSelectClip={(clip) => setCurrentClip(clip)}
            onDeleteClip={handleDeleteClip}
            onClearHistory={handleClearHistory}
          />
        </section>

        {/* Feature Highlights & Shortcuts */}
        <footer
          className={`p-4 rounded-3xl border text-xs flex flex-wrap items-center justify-between gap-3 transition-colors ${
            isDark
              ? 'bg-gray-900/40 border-gray-800/60 text-gray-400'
              : 'bg-white/80 border-gray-200 text-gray-600 shadow-2xs'
          }`}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              MP3 & WAV Download
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              Speed & Tone Sliders
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-purple-500" />
              Dark / Light Mode
            </span>
          </div>

          <div className="text-[11px] text-gray-400">
            Shortcut: <kbd className="px-2 py-0.5 rounded-lg bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 font-mono text-gray-800 dark:text-gray-200">Ctrl/Cmd + Enter</kbd> to speak
          </div>
        </footer>
      </main>
    </div>
  );
}
