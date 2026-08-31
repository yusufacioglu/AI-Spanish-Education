import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Send, Volume2, Sparkles, Loader, User, Bot, RefreshCw, Square } from 'lucide-react';
import { speakSpanish, stopAllSpeech } from '../utils/speech';

interface SpeakingViewProps {
  profile: UserProfile;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  corrections?: string;
  hasError?: boolean;
}

export default function SpeakingView({ profile }: SpeakingViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initiate first welcome message from AI
    initiateConversation();
    return () => {
      stopAllSpeech();
    };
  }, [profile.cefrLevel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initiateConversation = async () => {
    setLoading(true);
    try {
      const levelPrompt = profile.cefrLevel === 'A0' || profile.cefrLevel === 'A1'
        ? 'Hola, soy tu tutora de español. ¿Cómo estás hoy? Dime tu nombre y de dónde eres.'
        : profile.cefrLevel === 'A2'
        ? '¡Hola! Qué bueno hablar contigo. Cuéntame un poco de tu día o qué planes tienes para este fin de semana.'
        : '¡Hola! Es un placer conversar contigo. Me gustaría que hablemos sobre algún tema de actualidad, cultura o tus objetivos con el español. ¿De qué te gustaría hablar hoy?';

      setMessages([
        {
          role: 'model',
          text: levelPrompt,
        }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    
    // Append user message
    const updatedMessages = [...messages, { role: 'user' as const, text: userText }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/speaking/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: updatedMessages.slice(-6), // Send last few messages for context
          userMessage: userText,
          cefrLevel: profile.cefrLevel
        }),
      });

      if (!res.ok) throw new Error('Konuşma eşlikçisi yanıt veremedi.');
      const data = await res.json();

      // Append bot response and assign corrections to user's message
      setMessages(prev => {
        const lastMsgIdx = prev.length - 1;
        const newMsgs = [...prev];
        // Inject feedback onto user's message
        if (newMsgs[lastMsgIdx] && newMsgs[lastMsgIdx].role === 'user') {
          newMsgs[lastMsgIdx] = {
            ...newMsgs[lastMsgIdx],
            corrections: data.corrections,
            hasError: data.hasError
          };
        }
        // Add model reply
        newMsgs.push({
          role: 'model',
          text: data.reply
        });
        return newMsgs;
      });
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        { role: 'model', text: 'Perdón, tuve un problema de conexión. ¿Podrías repetir lo que dijiste?' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (text: string, idx: number) => {
    if (ttsPlaying[idx]) {
      stopAllSpeech();
      setTtsPlaying(prev => ({ ...prev, [idx]: false }));
      return;
    }

    speakSpanish(text, {
      onStart: () => setTtsPlaying(prev => ({ ...prev, [idx]: true })),
      onEnd: () => setTtsPlaying(prev => ({ ...prev, [idx]: false })),
      onError: () => setTtsPlaying(prev => ({ ...prev, [idx]: false }))
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-lg h-[650px] flex flex-col overflow-hidden animate-fade-in">
      {/* Panel Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-6 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <h2 className="font-bold text-sm md:text-base">Práctica Oral Interactiva</h2>
            <p className="text-[10px] md:text-xs text-indigo-200">Sadece İspanyolca • AI Eğitmeniyle Karşılıklı Konuşma</p>
          </div>
        </div>
        
        <button
          onClick={initiateConversation}
          className="p-2 hover:bg-white/10 rounded-xl text-indigo-200 hover:text-white transition-all flex items-center gap-1.5 text-xs"
          title="Konuşmayı Yenile"
        >
          <RefreshCw className="w-4 h-4" />
          Temizle
        </button>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 bg-slate-50/50">
        {messages.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} className={`flex gap-3 max-w-4xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isUser ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-300'
              }`}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble Body */}
              <div className="space-y-1.5 max-w-[85%]">
                <div className={`p-4 rounded-2xl text-sm md:text-base relative ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  
                  {/* Play/Stop TTS button */}
                  <button
                    onClick={() => playTTS(msg.text, i)}
                    className={`absolute bottom-2 right-2 p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold ${
                      ttsPlaying[i]
                        ? 'bg-rose-500 text-white shadow-sm animate-pulse'
                        : isUser
                        ? 'bg-indigo-700/50 hover:bg-indigo-700 text-indigo-200 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                    title={ttsPlaying[i] ? 'Seslendirmeyi Durdur' : 'Doğal Kadın Sesiyle Dinle'}
                  >
                    {ttsPlaying[i] ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[10px]">Durdur</span>
                      </>
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Show Inline Feedback/Corrections for User message */}
                {isUser && msg.corrections && (
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex gap-2.5 ${
                    msg.hasError 
                      ? 'bg-amber-50 border-amber-100 text-amber-900' 
                      : 'bg-emerald-50 border-emerald-100 text-emerald-900'
                  }`}>
                    <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${msg.hasError ? 'text-amber-600' : 'text-emerald-600'}`} />
                    <div>
                      <span className="font-bold block mb-0.5">
                        {msg.hasError ? 'Dilbilgisi Geliştirme Önerisi:' : 'Mükemmel Yapı!'}
                      </span>
                      {msg.corrections}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-lg mr-auto">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-indigo-300 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Eğitmen yazıyor...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input console */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-3">
        <input
          type="text"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          placeholder="İspanyolca bir şeyler yazın..."
          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base focus:outline-none focus:border-indigo-500 disabled:opacity-75"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow transition-all flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
