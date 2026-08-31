import React, { useState, useEffect } from 'react';
import { ReadingText, UserProfile, VocabWord } from '../types';
import { BookOpen, Play, Square, Sparkles, Loader, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react';
import { speakSpanish, stopAllSpeech } from '../utils/speech';

interface ReadingViewProps {
  profile: UserProfile;
  onAddWord: (word: string, translation: string, context: string) => void;
  savedWords: VocabWord[];
}

export default function ReadingView({ profile, onAddWord, savedWords }: ReadingViewProps) {
  const [reading, setReading] = useState<ReadingText | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState('story');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [selectedWord, setSelectedWord] = useState<{ word: string; translation?: string } | null>(null);
  const [translatingWord, setTranslatingWord] = useState(false);
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    fetchReading();
    return () => {
      stopAllSpeech();
    };
  }, [profile.cefrLevel, selectedGenre]);

  const fetchReading = async () => {
    try {
      setLoading(true);
      setError(null);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setSelectedWord(null);

      const res = await fetch('/api/reading/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: profile.cefrLevel,
          genre: selectedGenre
        }),
      });
      if (!res.ok) throw new Error('Yapay zeka okuma parçası üretemedi.');
      const data = await res.json();
      setReading(data);
    } catch (err: any) {
      setError(err.message || 'Okuma parçası yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const playTTS = async () => {
    if (!reading) return;
    if (ttsLoading) {
      stopAllSpeech();
      setTtsLoading(false);
      return;
    }

    speakSpanish(reading.content, {
      onStart: () => setTtsLoading(true),
      onEnd: () => setTtsLoading(false),
      onError: () => setTtsLoading(false)
    });
  };

  // Click-to-Translate any word in the text using AI
  const translateWord = async (word: string) => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim();
    if (!cleanWord || translatingWord) return;

    // Check if word is already in vocabulary highlights
    const foundInVocab = reading?.vocabulary.find(v => v.word.toLowerCase() === cleanWord.toLowerCase());
    if (foundInVocab) {
      setSelectedWord({ word: cleanWord, translation: foundInVocab.translation });
      return;
    }

    setTranslatingWord(true);
    setSelectedWord({ word: cleanWord });

    try {
      const prompt = `You are a Spanish-Turkish translator. Translate the single Spanish word "${cleanWord}" to Turkish, in the context of reading. Provide only 1 to 3 words Turkish translation, nothing else.`;
      const res = await fetch('/api/speaking/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: prompt,
          cefrLevel: 'A1'
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Extract translation from reply
        let translation = data.reply.replace(/[{}]/g, "").trim();
        setSelectedWord({ word: cleanWord, translation });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTranslatingWord(false);
    }
  };

  const handleSaveWord = (word: string, translation: string) => {
    onAddWord(word, translation, `Okuma parçası: "${reading?.title}"`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-slate-800">Okuma & Dinleme Parçası Hazırlanıyor...</h3>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
          Seviyenize uygun kelimeleri pekiştirecek interaktif metinler ve seslendirmeler derleniyor.
        </p>
      </div>
    );
  }

  if (error || !reading) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto my-8">
        <p className="text-red-700 font-medium mb-4">{error || 'Okuma parçası bulunamadı'}</p>
        <button
          onClick={fetchReading}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition-all"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  // Split reading content to make each word interactive
  const contentWords = reading.content.split(/(\s+)/);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Main Text Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Genre Selector */}
        <div className="bg-white border border-slate-100 p-3 rounded-2xl shadow-sm flex flex-wrap gap-2">
          {['story', 'dialogue', 'news', 'history'].map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                selectedGenre === genre
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {genre === 'story' ? 'Hikaye' : genre === 'dialogue' ? 'Karşılıklı Konuşma' : genre === 'news' ? 'Haberler' : 'Tarih'}
            </button>
          ))}
        </div>

        {/* Reading Canvas */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-lg space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h1 className="text-lg md:text-xl font-bold text-slate-800">{reading.title}</h1>
            </div>
            
            <button
              onClick={playTTS}
              className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
                ttsLoading
                  ? 'bg-rose-500 text-white shadow-md animate-pulse'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
              }`}
              title={ttsLoading ? 'Seslendirmeyi Durdur' : 'Doğal Kadın Sesiyle Dinle'}
            >
              {ttsLoading ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Durdur</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Doğal Sesle Dinle</span>
                </>
              )}
            </button>
          </div>

          {/* Interactive Word Spans */}
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <p className="text-slate-800 text-base md:text-lg leading-relaxed select-none">
              {contentWords.map((word, idx) => {
                const isSpaces = /^\s+$/.test(word);
                if (isSpaces) return word;
                const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
                return (
                  <span
                    key={idx}
                    onClick={() => translateWord(word)}
                    className="cursor-pointer hover:bg-indigo-100/85 hover:text-indigo-950 px-0.5 rounded transition-all inline-block font-sans select-text border-b border-transparent hover:border-indigo-400"
                    title="Tıklayıp Çevir"
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          </div>

          {/* Line by line Turkish translation */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Tam Türkçe Çevirisi</h4>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap italic">
              {reading.translation}
            </p>
          </div>
        </div>

        {/* Comprehension Quiz */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-lg space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base md:text-lg font-bold text-slate-800">Okuduğunu Anlama Testi</h2>
          </div>

          <div className="space-y-6">
            {reading.comprehensionQuestions.map((q, qIdx) => (
              <div key={qIdx} className="space-y-3">
                <p className="font-semibold text-slate-800 text-sm md:text-base">{qIdx + 1}. {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => {
                    const isSel = quizAnswers[qIdx] === opt;
                    const isCorrect = opt === q.correctAnswer;
                    return (
                      <button
                        key={oIdx}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: opt }))}
                        className={`p-3 text-left rounded-xl border text-xs md:text-sm transition-all ${
                          quizSubmitted
                            ? isCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                              : isSel
                              ? 'bg-red-50 border-red-400 text-red-900'
                              : 'bg-white border-slate-100 text-slate-400'
                            : isSel
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && (
                  <div className={`p-3 rounded-xl text-xs flex gap-2 ${
                    quizAnswers[qIdx] === q.correctAnswer ? 'bg-emerald-50/50 text-emerald-800' : 'bg-amber-50/50 text-amber-800'
                  }`}>
                    {quizAnswers[qIdx] === q.correctAnswer ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold">Açıklama:</span> {q.explanation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!quizSubmitted && (
            <button
              onClick={() => setQuizSubmitted(true)}
              disabled={Object.keys(quizAnswers).length < reading.comprehensionQuestions.length}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              Cevapları Kontrol Et
            </button>
          )}
        </div>
      </div>

      {/* Click-to-Translate Tooltip & Highlight list */}
      <div className="lg:col-span-1 space-y-6">
        {/* Instant Translation Tooltip Panel */}
        {selectedWord && (
          <div className="bg-gradient-to-br from-indigo-950 to-slate-950 text-white rounded-3xl p-6 shadow-lg border border-indigo-500/10 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center border-b border-indigo-500/20 pb-3">
              <span className="text-xs font-bold uppercase text-indigo-300 tracking-wider">Hızlı Çeviri Sözlüğü</span>
              <button onClick={() => setSelectedWord(null)} className="text-indigo-400 hover:text-white text-xs">Kapat</button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight font-sans text-indigo-100">{selectedWord.word}</h3>
              {translatingWord ? (
                <div className="flex items-center gap-2 text-xs text-indigo-400 py-1">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  Yapay zeka çeviriyor...
                </div>
              ) : (
                <p className="text-base text-emerald-400 font-bold">{selectedWord.translation || 'Çeviri bulunamadı'}</p>
              )}
            </div>

            {selectedWord.translation && (
              <button
                onClick={() => handleSaveWord(selectedWord.word, selectedWord.translation!)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                Kelime Kutuma Kaydet
              </button>
            )}
          </div>
        )}

        {/* Text vocabulary Highlight List */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Metnin Anahtar Kelimeleri</h3>
          <div className="space-y-3">
            {reading.vocabulary.map((vocab, i) => {
              const isSaved = savedWords.some(w => w.word.toLowerCase() === vocab.word.toLowerCase());
              return (
                <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 text-sm">{vocab.word}</p>
                    <p className="text-xs text-slate-500">{vocab.translation}</p>
                  </div>
                  
                  <button
                    onClick={() => handleSaveWord(vocab.word, vocab.translation)}
                    disabled={isSaved}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                      isSaved
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : 'bg-white hover:bg-indigo-50 border-slate-200 text-slate-600 hover:text-indigo-600'
                    }`}
                  >
                    {isSaved ? 'Kayıtlı' : 'Ekle'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
