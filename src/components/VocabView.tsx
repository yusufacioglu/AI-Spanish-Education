import React, { useState, useEffect } from 'react';
import { VocabWord } from '../types';
import { Bookmark, Sparkles, RotateCcw, Check, X, Calendar, Layers, GraduationCap, Volume2, Square } from 'lucide-react';
import { speakSpanish, stopAllSpeech } from '../utils/speech';

interface VocabViewProps {
  words: VocabWord[];
  onReviewWord: (wordId: string, correct: boolean) => void;
}

export default function VocabView({ words, onReviewWord }: VocabViewProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'srs'>('list');
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopAllSpeech();
    };
  }, []);

  const playWordAudio = (e: React.MouseEvent, word: string, id: string) => {
    e.stopPropagation();
    if (playingWordId === id) {
      stopAllSpeech();
      setPlayingWordId(null);
      return;
    }

    speakSpanish(word, {
      onStart: () => setPlayingWordId(id),
      onEnd: () => setPlayingWordId(null),
      onError: () => setPlayingWordId(null)
    });
  };

  // Filter words that are due for review
  const now = new Date();
  const dueWords = words.filter(w => {
    const nextReview = new Date(w.nextReviewDate);
    return nextReview <= now;
  });

  // If SRS tab is active, we can play with dueWords, or fallback to all words if dueWords is empty so they can still practice!
  const reviewPool = dueWords.length > 0 ? dueWords : words;

  const handleScoreCard = (correct: boolean) => {
    if (reviewPool.length === 0) return;
    const word = reviewPool[currentCardIdx];
    
    // Trigger update on parent
    onReviewWord(word.id, correct);

    // Transition to next card
    setIsFlipped(false);
    setTimeout(() => {
      if (currentCardIdx < reviewPool.length - 1) {
        setCurrentCardIdx(prev => prev + 1);
      } else {
        setCurrentCardIdx(0); // restart/complete
        alert('Kelime kartı tekrar turu tamamlandı! Unutulmayan hafıza yolları oluşturuldu.');
      }
    }, 200);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Controls */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'list'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sözlüğüm ({words.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('srs');
            setCurrentCardIdx(0);
            setIsFlipped(false);
          }}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'srs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Spaced Repetition Tekrarı
          {dueWords.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-extrabold rounded-full">
              {dueWords.length} Güncel
            </span>
          )}
        </button>
      </div>

      {/* Dictionary List View */}
      {activeTab === 'list' && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg">
          {words.length === 0 ? (
            <div className="p-12 text-center text-slate-500 max-w-sm mx-auto">
              <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-slate-800">Henüz kelime eklenmedi</h3>
              <p className="text-xs text-slate-500 mt-2">
                Dersleri çalışırken veya interaktif okumalar yaparken kelimelerin üzerine tıklayarak buraya kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {words.map((w) => {
                const nextReview = new Date(w.nextReviewDate);
                const isDue = nextReview <= now;

                return (
                  <div key={w.id} className="p-4 bg-slate-50/50 border border-slate-150 rounded-2xl flex flex-col justify-between space-y-3 shadow-sm hover:shadow transition-all">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">{w.word}</span>
                          <button
                            onClick={(e) => playWordAudio(e, w.word, w.id)}
                            className={`p-1 rounded-md transition-all ${
                              playingWordId === w.id
                                ? 'bg-rose-500 text-white shadow-sm animate-pulse'
                                : 'text-indigo-600 hover:bg-indigo-100/60'
                            }`}
                            title={playingWordId === w.id ? 'Durdur' : 'Doğal Kadın Sesiyle Dinle'}
                          >
                            {playingWordId === w.id ? (
                              <Square className="w-3 h-3 fill-current" />
                            ) : (
                              <Volume2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                          w.box === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          Kutu {w.box}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">{w.translation}</p>
                      {w.context && (
                        <p className="text-[11px] text-slate-400 italic mt-2 line-clamp-2">“{w.context}”</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/40 pt-2.5 text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {isDue ? (
                          <span className="text-red-500 font-bold">Tekrar Zamanı!</span>
                        ) : (
                          <span>Tekrar: {nextReview.toLocaleDateString('tr-TR')}</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Check className="w-3 h-3 text-emerald-500" /> {w.correctCount} / <X className="w-3 h-3 text-red-500" /> {w.incorrectCount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SRS Flashcards Review Game View */}
      {activeTab === 'srs' && (
        <div className="max-w-md mx-auto space-y-6">
          {reviewPool.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-lg">
              <GraduationCap className="w-12 h-12 text-indigo-600 mx-auto mb-4 animate-bounce" />
              <h3 className="text-lg font-bold text-slate-800">Tebrikler!</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Tekrar edilmesi gereken hiç kelimeniz bulunmuyor. Tüm kelimeleriniz zihninize kazınmış durumda!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Card deck visual feedback */}
              <div className="flex justify-between items-center px-2">
                <span className="text-xs text-slate-500 font-semibold uppercase">
                  Tekrar Listesi ({currentCardIdx + 1} / {reviewPool.length})
                </span>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full">
                  Süreç: %{Math.round(((currentCardIdx + 1) / reviewPool.length) * 100)}
                </span>
              </div>

              {/* Flippable Card */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer h-72 rounded-3xl border border-slate-100 shadow-xl relative preserve-3d transition-transform duration-500 select-none bg-white"
                style={{ transform: isFlipped ? 'rotateY(180deg)' : 'none' }}
              >
                {/* Front Side */}
                <div
                  className="absolute inset-0 p-6 flex flex-col justify-between backface-hidden"
                  style={{ visibility: isFlipped ? 'hidden' : 'visible' }}
                >
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> Kutu {reviewPool[currentCardIdx].box}</span>
                    <span className="font-bold text-indigo-600 uppercase">CEFR {reviewPool[currentCardIdx].level}</span>
                  </div>

                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {reviewPool[currentCardIdx].word}
                      </h2>
                      <button
                        onClick={(e) => playWordAudio(e, reviewPool[currentCardIdx].word, `card-${reviewPool[currentCardIdx].id}`)}
                        className={`p-2 rounded-full transition-all ${
                          playingWordId === `card-${reviewPool[currentCardIdx].id}`
                            ? 'bg-rose-500 text-white shadow-md animate-pulse'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                        title="Doğal Kadın Sesiyle Dinle"
                      >
                        {playingWordId === `card-${reviewPool[currentCardIdx].id}` ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {reviewPool[currentCardIdx].context && (
                      <p className="text-xs text-slate-500 max-w-xs mx-auto italic mt-2">
                        “{reviewPool[currentCardIdx].context}”
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] font-bold text-indigo-500 text-center uppercase tracking-wider animate-pulse">
                    Kartı Çevirmek İçin Tıkla
                  </span>
                </div>

                {/* Back Side */}
                <div
                  className="absolute inset-0 p-6 flex flex-col justify-between backface-hidden bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl"
                  style={{ transform: 'rotateY(180deg)', visibility: isFlipped ? 'visible' : 'hidden' }}
                >
                  <div className="flex justify-between items-center text-xs text-indigo-200">
                    <span>Hafıza Çözümlemesi</span>
                    <span className="font-mono bg-indigo-900/40 px-2 py-0.5 rounded border border-indigo-700/20">TR KARŞILIĞI</span>
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-emerald-400">
                      {reviewPool[currentCardIdx].translation}
                    </h2>
                  </div>

                  <span className="text-[10px] text-center text-indigo-300 font-semibold uppercase tracking-wider">
                    Öğrenme durumunu aşağıdan oyla
                  </span>
                </div>
              </div>

              {/* SR Control Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleScoreCard(false)}
                  className="p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl flex flex-col items-center gap-1 text-red-700 font-bold text-xs transition-all shadow"
                >
                  <X className="w-5 h-5 text-red-600" />
                  <span>Unuttum / Zorlandım</span>
                  <span className="text-[9px] text-red-500/80 font-normal">Kutu 1'e sıfırlanır</span>
                </button>

                <button
                  onClick={() => handleScoreCard(true)}
                  className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex flex-col items-center gap-1 text-emerald-800 font-bold text-xs transition-all shadow"
                >
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Biliyorum / Hatırladım</span>
                  <span className="text-[9px] text-emerald-600/80 font-normal">Sonraki kutuya geçer</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
