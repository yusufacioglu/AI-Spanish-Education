import React, { useState } from 'react';
import {
  FEMALE_VOICE_OPTIONS,
  getVoiceSettings,
  saveVoiceSettings,
  speakSpanish,
  stopAllSpeech,
  VoiceSettings
} from '../utils/speech';
import { Volume2, Check, Sparkles, X, Play, Square, Settings2, Sliders } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceSettingsModal({ isOpen, onClose }: VoiceSettingsModalProps) {
  const [settings, setSettings] = useState<VoiceSettings>(getVoiceSettings());
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectVoice = (id: string) => {
    const updated = { ...settings, preferredVoiceId: id };
    setSettings(updated);
    saveVoiceSettings(updated);
  };

  const handleSelectSpeed = (speed: number) => {
    const updated = { ...settings, speed };
    setSettings(updated);
    saveVoiceSettings(updated);
  };

  const handleTestVoice = (voiceId: string) => {
    if (playingVoiceId === voiceId) {
      stopAllSpeech();
      setPlayingVoiceId(null);
      return;
    }

    const testPhrases: Record<string, string> = {
      sofia: '¡Hola! Me llamo Sofía. Te acompañaré con pronunciación natural y clara en tu aprendizaje de español.',
      lucia: '¡Hola! Soy Lucía. Estoy lista para practicar conversación y perfeccionar tu acento en español.',
      elena: '¡Hola! Soy Elena. Aprenderemos paso a paso cada regla gramatical y fonética con calma.',
      carmen: '¡Hola! Soy Carmen. ¡Vamos a hablar español con fluidez y mucha energía hoy!'
    };

    const phrase = testPhrases[voiceId] || '¡Hola! Esta es mi voz en español.';

    speakSpanish(phrase, {
      voiceId,
      speed: settings.speed,
      onStart: () => setPlayingVoiceId(voiceId),
      onEnd: () => setPlayingVoiceId(null),
      onError: () => setPlayingVoiceId(null)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Seslendirme & Telaffuz Ayarları</h2>
              <p className="text-xs text-slate-500">Doğal, stüdyo kalitesinde İspanyolca kadın sesleri</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopAllSpeech();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voice Selection List */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tercih Edilen Kadın Sesi
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {FEMALE_VOICE_OPTIONS.map((v) => {
              const isSelected = settings.preferredVoiceId === v.id;
              const isPlaying = playingVoiceId === v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => handleSelectVoice(v.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {v.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{v.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {v.tone}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Seçili
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestVoice(v.id);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isPlaying
                        ? 'bg-rose-500 text-white shadow-md'
                        : isSelected
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={isPlaying ? 'Durdur' : 'Sesi Dinle'}
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Durdur</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Dinle</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Speed Adjustment */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Konuşma Hızı
            </label>
            <span className="text-xs font-bold text-indigo-600">{settings.speed}x</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { val: 0.8, label: '0.8x Yavaş' },
              { val: 0.95, label: 'Doğal (0.95x)' },
              { val: 1.0, label: '1.0x Standart' },
              { val: 1.15, label: '1.15x Hızlı' }
            ].map((sp) => (
              <button
                key={sp.val}
                type="button"
                onClick={() => handleSelectSpeed(sp.val)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  settings.speed === sp.val
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Information Callout */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Seslendirmeler, yapay zekâ stüdyo sentezleyicisi ve doğal kadın ses tonlamalarıyla optimize edilmiştir. Derslerdeki, kelimelerdeki ve okuma metinlerindeki tüm ses butonları bu ayarları kullanır.
          </span>
        </div>

        {/* Footer actions */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              stopAllSpeech();
              onClose();
            }}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all text-sm"
          >
            Ayarları Kaydet ve Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
