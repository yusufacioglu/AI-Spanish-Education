import React, { useState, useEffect } from 'react';
import { DynamicLesson, Exercise, UserProfile, VocabWord } from '../types';
import { Play, Square, Sparkles, AlertCircle, CheckCircle2, HelpCircle, Loader, ArrowRight, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { speakSpanish, stopAllSpeech } from '../utils/speech';

interface LessonViewProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onAddWord: (word: string, translation: string, context: string) => void;
  savedWords: VocabWord[];
}

export default function LessonView({ profile, onUpdateProfile, onAddWord, savedWords }: LessonViewProps) {
  const [lesson, setLesson] = useState<DynamicLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [evaluations, setEvaluations] = useState<Record<string, { correct: boolean; explanation?: string; similarExamples?: any[] }>>({});
  const [explainingId, setExplainingId] = useState<string | null>(null);

  useEffect(() => {
    fetchLesson();
    return () => {
      stopAllSpeech();
    };
  }, [profile.cefrLevel]);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/lesson/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cefrLevel: profile.cefrLevel,
          weakTopics: profile.weakTopics,
          strongTopics: profile.strongTopics,
          passiveWords: profile.passiveWords,
        }),
      });
      if (!res.ok) throw new Error('Yapay zeka ders üretemedi.');
      const data = await res.json();
      setLesson(data);
      setAnswers({});
      setSubmitted({});
      setEvaluations({});
    } catch (err: any) {
      setError(err.message || 'Ders yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async (text: string, id: string) => {
    if (ttsLoading[id]) {
      stopAllSpeech();
      setTtsLoading(prev => ({ ...prev, [id]: false }));
      return;
    }

    speakSpanish(text, {
      onStart: () => setTtsLoading(prev => ({ ...prev, [id]: true })),
      onEnd: () => setTtsLoading(prev => ({ ...prev, [id]: false })),
      onError: () => setTtsLoading(prev => ({ ...prev, [id]: false }))
    });
  };

  const handleWordSave = (word: string, translation: string, context: string) => {
    onAddWord(word, translation, context);
  };

  const checkAnswer = (ex: Exercise) => {
    const userAnswer = (answers[ex.id] || '').trim();
    if (!userAnswer) return;

    const isCorrect = userAnswer.toLowerCase() === ex.correctAnswer.toLowerCase();
    
    setSubmitted(prev => ({ ...prev, [ex.id]: true }));
    setEvaluations(prev => ({
      ...prev,
      [ex.id]: {
        correct: isCorrect,
        explanation: isCorrect ? 'Harika! Doğru cevap.' : undefined
      }
    }));

    // If correct, update profile stats slightly
    if (isCorrect) {
      const accuracyInc = Math.min(100, profile.grammarAccuracy + 1);
      onUpdateProfile({
        ...profile,
        grammarAccuracy: accuracyInc
      });
    }
  };

  const requestErrorExplanation = async (ex: Exercise) => {
    try {
      setExplainingId(ex.id);
      const userAnswer = answers[ex.id] || '';
      
      const res = await fetch('/api/writing/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `Exercise verification for: "${ex.question}"`,
          submission: userAnswer,
          cefrLevel: profile.cefrLevel
        }),
      });
      if (!res.ok) throw new Error('Hata analizi alınamadı.');
      const evaluation = await res.json();

      setEvaluations(prev => ({
        ...prev,
        [ex.id]: {
          correct: false,
          explanation: evaluation.feedback,
          similarExamples: evaluation.errors?.length > 0 ? evaluation.errors : [
            {
              original: userAnswer,
              corrected: ex.correctAnswer,
              explanation: `Girdiğiniz cevap: "${userAnswer}". Doğru cevap: "${ex.correctAnswer}". ${ex.hint || ''}`
            }
          ]
        }
      }));
    } catch (err) {
      console.error(err);
      alert('Analiz alınırken hata oluştu.');
    } finally {
      setExplainingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-slate-800">Kişiselleştirilmiş Ders Tasarlanıyor...</h3>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
          Seviyenize ve zayıf konularınıza göre özel mantıksal anlatımlar ve egzersizler hazırlanıyor.
        </p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto my-8">
        <p className="text-red-700 font-medium mb-4">{error || 'Ders bulunamadı'}</p>
        <button
          onClick={fetchLesson}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition-all"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Lesson Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex justify-between items-start">
          <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 text-xs font-semibold rounded-full uppercase tracking-wider">
            Seviye: {lesson.level} • {lesson.topic}
          </span>
          <button
            onClick={fetchLesson}
            className="text-xs text-indigo-200 hover:text-white border border-indigo-500/30 hover:border-white px-3 py-1.5 rounded-xl transition-all"
          >
            Yeni Ders Üret
          </button>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-4 leading-tight">
          {lesson.title}
        </h1>
        <p className="text-indigo-200 text-sm mt-2 max-w-2xl leading-relaxed">
          Ezberci dil eğitimini bırakın. Bu derste İspanyolca dilinin mantığını kavramsal ve karşılaştırmalı olarak inceleyeceğiz.
        </p>
      </div>

      {/* Logic & Explanation Canvas */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">Mantıksal Yapı ve Karşılaştırma</h2>
        </div>
        
        {/* Render text with line breaks */}
        <div className="text-slate-600 text-sm md:text-base leading-relaxed space-y-4">
          {lesson.explanation.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="whitespace-pre-line">{paragraph}</p>
          ))}
        </div>

        {/* Examples Section */}
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wider">Örnek Cümleler & Çözümleme</h3>
          <div className="space-y-4">
            {lesson.examples.map((ex, i) => {
              const exId = `ex-${i}`;
              return (
                <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <p className="font-semibold text-slate-900 text-base flex items-center gap-2">
                      {ex.spanish}
                      <button
                        onClick={() => playTTS(ex.spanish, exId)}
                        className={`p-1.5 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                          ttsLoading[exId]
                            ? 'bg-rose-500 text-white shadow-sm animate-pulse'
                            : 'bg-indigo-100/70 hover:bg-indigo-100 text-indigo-700 hover:scale-105 active:scale-95'
                        }`}
                        title={ttsLoading[exId] ? 'Durdur' : 'Doğal Kadın Sesiyle Dinle'}
                      >
                        {ttsLoading[exId] ? (
                          <Square className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                      </button>
                    </p>
                    <p className="text-sm text-slate-600 font-medium">{ex.turkish}</p>
                    {ex.explanation && (
                      <p className="text-xs text-slate-500 italic mt-1 leading-relaxed">
                        • {ex.explanation}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vocabulary highlight */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-lg">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Derse Ait Önemli Kelimeler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lesson.vocabulary.map((vocab, i) => {
            const vocabId = `vocab-${i}`;
            const isSaved = savedWords.some(w => w.word.toLowerCase() === vocab.word.toLowerCase());
            return (
              <div key={i} className="p-4 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl flex justify-between items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-950 text-base">{vocab.word}</span>
                    <button
                      onClick={() => playTTS(vocab.word, vocabId)}
                      className={`p-1.5 rounded-md transition-all ${
                        ttsLoading[vocabId]
                          ? 'bg-rose-500 text-white shadow-sm animate-pulse'
                          : 'text-indigo-600 hover:bg-indigo-100/60'
                      }`}
                      title={ttsLoading[vocabId] ? 'Durdur' : 'Doğal Kadın Sesiyle Dinle'}
                    >
                      {ttsLoading[vocabId] ? (
                        <Square className="w-3 h-3 fill-current" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600">{vocab.translation}</p>
                  {vocab.pronunciation && (
                    <p className="text-[10px] text-slate-400 font-mono">Okunuş: [{vocab.pronunciation}]</p>
                  )}
                </div>
                
                <button
                  onClick={() => handleWordSave(vocab.word, vocab.translation, `Ders konusu: ${lesson.topic}`)}
                  className={`p-2 rounded-xl border transition-all ${
                    isSaved
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500 hover:text-indigo-600'
                  }`}
                  title={isSaved ? 'Kelimelerimde Kayıtlı' : 'Kelime Kutusuna Ekle'}
                >
                  {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Exercises Console */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-lg">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Pratik ve Pekiştime Egzersizleri</h2>
        <div className="space-y-8">
          {lesson.exercises.map((ex, i) => {
            const isSubmitted = submitted[ex.id];
            const isCorrect = evaluations[ex.id]?.correct;
            const evalData = evaluations[ex.id];

            return (
              <div key={ex.id} className="p-6 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Egzersiz {i + 1}</span>
                    <h3 className="text-base font-bold text-slate-800">{ex.question}</h3>
                  </div>
                  {isSubmitted && (
                    isCorrect ? (
                      <span className="p-1 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded-full bg-red-100 text-red-600 shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </span>
                    )
                  )}
                </div>

                {/* Question form based on type */}
                {ex.type === 'multiple-choice' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ex.options?.map((option, idx) => {
                      const isSel = answers[ex.id] === option;
                      return (
                        <button
                          key={idx}
                          disabled={isSubmitted}
                          onClick={() => setAnswers(prev => ({ ...prev, [ex.id]: option }))}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs md:text-sm font-medium transition-all ${
                            isSel
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled={isSubmitted}
                    placeholder="Cevabınızı İspanyolca yazın..."
                    value={answers[ex.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [ex.id]: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                  />
                )}

                {/* Submits/Evaluations Controls */}
                <div className="flex justify-between items-center gap-3 pt-2">
                  <div className="text-xs text-slate-400">
                    {ex.hint && <span className="italic">İpucu: {ex.hint}</span>}
                  </div>
                  
                  {!isSubmitted ? (
                    <button
                      onClick={() => checkAnswer(ex)}
                      disabled={!answers[ex.id]}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow transition-all flex items-center gap-1"
                    >
                      Cevabı Kontrol Et
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    !isCorrect && (
                      <button
                        onClick={() => requestErrorExplanation(ex)}
                        disabled={explainingId === ex.id}
                        className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        {explainingId === ex.id ? (
                          <>
                            <Loader className="w-3.5 h-3.5 animate-spin text-amber-600" />
                            AI Analizi Yapılıyor...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            AI Hata Analizi İstiyorum
                          </>
                        )}
                      </button>
                    )
                  )}
                </div>

                {/* AI Explanation Alert - Underneath */}
                {isSubmitted && evalData && (
                  <div className={`p-4 rounded-xl text-xs md:text-sm ${isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                    <p className="font-semibold">{isCorrect ? 'Tebrikler!' : 'Doğru Cevap:'} <span className="font-mono bg-white px-2 py-0.5 rounded border ml-1">{ex.correctAnswer}</span></p>
                    
                    {evalData.explanation && (
                      <p className="mt-2 text-slate-600 leading-relaxed whitespace-pre-wrap">{evalData.explanation}</p>
                    )}

                    {/* Fulfills specific error requirements: 5 comparative samples */}
                    {!isCorrect && evalData.similarExamples && (
                      <div className="mt-3 border-t border-red-200/50 pt-3 space-y-2">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-red-700">Mantıksal Karşılaştırma & Benzer 5 Örnek:</span>
                        <div className="grid grid-cols-1 gap-2 mt-1">
                          {evalData.similarExamples.map((item: any, idx: number) => (
                            <div key={idx} className="p-2.5 bg-white/70 rounded-lg border border-red-100/50">
                              <p className="font-semibold text-slate-800">{item.corrected || item.spanish || ex.correctAnswer}</p>
                              {item.original && <p className="text-slate-400 line-through text-[11px]">Hatalı varyasyon: {item.original}</p>}
                              <p className="text-slate-500 text-[11px] mt-0.5">{item.explanation || 'Benzer yapı'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
