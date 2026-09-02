export interface VoiceOption {
  id: string;
  name: string;
  geminiVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Aoede';
  gender: 'Female' | 'Male' | 'Neutral';
  accent: string;
  tone: string;
  description: string;
  avatarColor: string;
  tags: string[];
  sampleText: string;
}

export interface StyleOption {
  id: string;
  label: string;
  iconName: string;
  promptModifier: string;
  description: string;
  badgeColor: string;
}

export interface ToneOption {
  id: string;
  label: string;
  description: string;
  bassBoost: number; // dB
  trebleBoost: number; // dB
  pitchShiftPrompt?: string;
  iconName: string;
}

export interface AudioClip {
  id: string;
  text: string;
  voiceName: string;
  style: string;
  audioUrl: string;
  duration: number;
  createdAt: number;
  mode: 'single' | 'multi';
  speakers?: Array<{ speaker: string; voiceName: string; text: string }>;
  speed?: number;
  tone?: string;
}

export interface DialogueLine {
  id: string;
  speaker: 'Speaker A' | 'Speaker B';
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Aoede';
  text: string;
}

export interface ScriptPreset {
  id: string;
  title: string;
  category: string;
  icon: string;
  text: string;
  suggestedVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Aoede';
  suggestedStyle: string;
}

export type ThemeMode = 'dark' | 'light';
