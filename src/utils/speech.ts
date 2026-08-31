/**
 * Advanced Spanish Speech Engine (Natural Human-Like Female Voices)
 * Supports Studio-Grade AI Audio via Gemini (Aoede/Kore/Leda/Callisto) with automatic
 * PCM-to-WAV conversion, plus enhanced browser Web Speech synthesis with natural female acoustic tuning.
 */

export interface VoiceOption {
  id: string;
  name: string;
  geminiVoice: 'Aoede' | 'Kore' | 'Leda' | 'Callisto' | 'Zephyr';
  description: string;
  tone: string;
}

export const FEMALE_VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'sofia',
    name: 'Sofía',
    geminiVoice: 'Aoede',
    description: 'Doğal, sıcak ve melodik İspanyolca kadın sesi',
    tone: 'Sıcak & Akıcı (Önerilen)'
  },
  {
    id: 'lucia',
    name: 'Lucía',
    geminiVoice: 'Kore',
    description: 'Net, enerjik ve berrak telaffuz',
    tone: 'Berrak & Dinamik'
  },
  {
    id: 'elena',
    name: 'Elena',
    geminiVoice: 'Leda',
    description: 'Yumuşak, sakin ve öğretici ton',
    tone: 'Sakin & Eğitici'
  },
  {
    id: 'carmen',
    name: 'Carmen',
    geminiVoice: 'Callisto',
    description: 'Canlı, akıcı ve günlük konuşma tonu',
    tone: 'Doğal & Günlük'
  }
];

const SETTINGS_KEY = 'sp_voice_settings_v1';

export interface VoiceSettings {
  preferredVoiceId: string;
  speed: number; // 0.8, 0.95, 1.0, 1.15
  autoPlayOnNewText: boolean;
}

export function getVoiceSettings(): VoiceSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    // fallback
  }
  return {
    preferredVoiceId: 'sofia',
    speed: 0.95,
    autoPlayOnNewText: false,
  };
}

export function saveVoiceSettings(settings: VoiceSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save voice settings:', e);
  }
}

// Global audio element to prevent overlapping speech
let currentAudioElement: HTMLAudioElement | null = null;

// Audio cache for instant replay
const audioCache = new Map<string, string>();

/**
 * Pre-fetches and finds the best natural female Spanish voice on the browser
 */
export function getBestBrowserSpanishFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. High-priority neural / natural female Spanish voices
  const preferredFemaleNames = [
    'natural', 'online', 'neural', 'premium',
    'paloma', 'elvira', 'dalia', 'monica', 'mónica',
    'paulina', 'helena', 'laura', 'francisca', 'sofia', 'sofía',
    'victoria', 'lucia', 'lucía', 'penelope', 'penélope',
    'google español', 'google spanish', 'carmen', 'rosa', 'alva'
  ];

  const spanishVoices = voices.filter(v => 
    v.lang.startsWith('es') || v.lang.startsWith('ES') || v.lang.includes('Spanish')
  );

  if (spanishVoices.length === 0) return null;

  // Search for known natural female voices
  for (const preferred of preferredFemaleNames) {
    const match = spanishVoices.find(v => {
      const nameLower = v.name.toLowerCase();
      return nameLower.includes(preferred);
    });
    if (match) return match;
  }

  // Search for any female voice tag
  const femaleTagged = spanishVoices.find(v => {
    const nameLower = v.name.toLowerCase();
    return nameLower.includes('female') || nameLower.includes('woman') || nameLower.includes('mujer') || nameLower.includes('fem');
  });
  if (femaleTagged) return femaleTagged;

  // Prioritize Castilian / Standard Spanish (es-ES) or Mexican (es-MX)
  const esES = spanishVoices.find(v => v.lang === 'es-ES' || v.lang === 'es_ES');
  if (esES) return esES;

  return spanishVoices[0];
}

/**
 * Stop any ongoing audio or speech
 */
export function stopAllSpeech() {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch (e) {
      // ignore
    }
    currentAudioElement = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Plays Spanish text with natural, human-like female voice
 */
export async function speakSpanish(
  text: string,
  options?: {
    voiceId?: string;
    speed?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  const cleanText = text.trim();
  if (!cleanText) return;

  stopAllSpeech();

  const settings = getVoiceSettings();
  const voiceId = options?.voiceId || settings.preferredVoiceId;
  const speed = options?.speed || settings.speed || 0.95;

  const selectedVoice = FEMALE_VOICE_OPTIONS.find(v => v.id === voiceId) || FEMALE_VOICE_OPTIONS[0];

  options?.onStart?.();

  const cacheKey = `${selectedVoice.geminiVoice}_${speed}_${cleanText}`;

  // 1. Check if cached studio audio is available
  if (audioCache.has(cacheKey)) {
    const audioUrl = audioCache.get(cacheKey)!;
    try {
      const audio = new Audio(audioUrl);
      currentAudioElement = audio;
      audio.playbackRate = speed;
      audio.onended = () => {
        currentAudioElement = null;
        options?.onEnd?.();
      };
      audio.onerror = () => {
        fallbackToBrowserSpeech(cleanText, speed, options);
      };
      await audio.play();
      return;
    } catch (e) {
      console.warn('Cached audio playback failed, falling back:', e);
    }
  }

  // 2. Request studio AI voice from server
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        voice: selectedVoice.geminiVoice,
        speed: speed
      }),
    });

    if (!res.ok) {
      throw new Error(`TTS server error status: ${res.status}`);
    }

    const data = await res.json();
    if (data.audio) {
      const audioBytes = atob(data.audio);
      const arrayBuffer = new ArrayBuffer(audioBytes.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioBytes.length; i++) {
        view[i] = audioBytes.charCodeAt(i);
      }

      const mimeType = data.mimeType || 'audio/wav';
      const blob = new Blob([arrayBuffer], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      audioCache.set(cacheKey, audioUrl);

      const audio = new Audio(audioUrl);
      currentAudioElement = audio;
      audio.playbackRate = speed;
      audio.onended = () => {
        currentAudioElement = null;
        options?.onEnd?.();
      };
      audio.onerror = () => {
        fallbackToBrowserSpeech(cleanText, speed, options);
      };

      await audio.play();
      return;
    } else {
      throw new Error('No audio in response');
    }
  } catch (err) {
    // 3. Fallback to finely-tuned browser speech synthesis with female voice
    console.info('Using enhanced browser female voice for Spanish:', err);
    fallbackToBrowserSpeech(cleanText, speed, options);
  }
}

/**
 * High-quality browser speech synthesis fallback with natural female characteristics
 */
function fallbackToBrowserSpeech(
  text: string,
  speed: number = 0.95,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options?.onError?.(new Error('Speech synthesis not supported in this browser'));
    options?.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    
    // Natural female acoustic settings
    utterance.pitch = 1.08; // Warm, gentle female pitch
    utterance.rate = Math.max(0.7, Math.min(1.2, speed * 0.95)); // Slightly relaxed for clarity

    const bestVoice = getBestBrowserSpanishFemaleVoice();
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    }

    utterance.onend = () => {
      options?.onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      options?.onError?.(e);
      options?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('Speech synthesis execution failed:', e);
    options?.onError?.(e);
    options?.onEnd?.();
  }
}
