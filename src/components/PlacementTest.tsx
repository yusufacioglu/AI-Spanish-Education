import React, { useState, useEffect } from 'react';
import { Exercise, UserProfile } from '../types';
import { Sparkles, BrainCircuit, ArrowRight, Loader, Info } from 'lucide-react';

interface PlacementTestProps {
  onComplete: (profile: UserProfile, feedback: string) => void;
}

export default function PlacementTest({ onComplete }: PlacementTestProps) {
  const [questions, setQuestions] = useState<Exercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/placement/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Placement test questions could not be loaded.');
      const data = await res.ok ? await res.json() : [];
      setQuestions(data);
    } catch (err: any) {
      setError(err.message || 'Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentIdx];
    const newAnswers = { ...answers, [currentQuestion.id]: selectedAnswer };
    setAnswers(newAnswers);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(newAnswers[questions[currentIdx + 1].id] || '');
      setShowHint(false);
    } else {
      evaluateResults(newAnswers);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
      setSelectedAnswer(answers[questions[currentIdx - 1].id] || '');
      setShowHint(false);
    }
  };

  const evaluateResults = async (finalAnswers: Record<string, string>) => {
    try {
      setSubmitting(true);
      // Calculate correct answers
      let correctCount = 0;
      questions.forEach((q) => {
        if (finalAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          correctCount++;
        }
      });

      const accuracy = (correctCount / questions.length) * 100;
      
      // Map score to a starting level
      let level: 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' = 'A1';
      let weakTopics: string[] = [];
      let strongTopics: string[] = [];
      let feedback = '';

      if (accuracy <= 20) {
        level = 'A0';
        weakTopics = ['Temel Selamlaşmalar', 'Kişi Zamirleri (Yo, Tú)', 'Ser ve Estar Farkı'];
        strongTopics = ['Temel Kelimeler'];
        feedback = 'İspanyolca öğrenme yolculuğuna sıfırdan başlıyoruz! Harika bir seçim yaptın. Sözel ve mantıksal yapıyı sindirerek ilerleyeceğiz.';
      } else if (accuracy <= 50) {
        level = 'A1';
        weakTopics = ['Ser ve Estar Farkı', 'Düzenli Fiil Çekimleri (Presente)', 'İsimlerin Cinsiyeti (Género)'];
        strongTopics = ['Temel Selamlaşmalar', 'Sayılar'];
        feedback = 'Giriş seviyesinde bazı temellerin var! Ser/Estar ve fiil çekimlerindeki mantıksal yapıları çözerek sağlam bir temel kuracağız.';
      } else if (accuracy <= 80) {
        level = 'A2';
        weakTopics = ['Geçmiş Zamanlar (Indefinido vs Imperfecto)', 'Por ve Para Ayrımı', 'Dönüşlü Fiiller (Verbos Reflexivos)'];
        strongTopics = ['Şimdiki Zaman', 'Kişisel Zamirler'];
        feedback = 'Orta seviyeye geçiş aşamasındasın. İspanyolcanın en kritik konularından biri olan geçmiş zaman ayrımları (Indefinido vs Imperfecto) üzerinde duracağız.';
      } else {
        level = 'B1';
        weakTopics = ['Subjuntivo (Dilek/Şart Kipi) Giriş', 'Condicional (Koşul Kipi)', 'Dolaylı Anlatım'];
        strongTopics = ['Geçmiş Zamanlar', 'Gelecek Zaman', 'Prepozisyonlar'];
        feedback = 'Tebrikler! İspanyolca temellerin oldukça güçlü. Şimdi DELE ve YDS hedeflerin için en kritik aşama olan Subjuntivo ve ileri düzey gramer mantığını fethedeceğiz.';
      }

      const generatedProfile: UserProfile = {
        cefrLevel: level,
        totalWords: level === 'A0' ? 10 : level === 'A1' ? 150 : level === 'A2' ? 450 : 800,
        activeWords: level === 'A0' ? [] : level === 'A1' ? ['hola', 'gracias', 'por favor'] : ['hablar', 'comer', 'vivir'],
        passiveWords: level === 'A0' ? [] : ['estudiar', 'comprender', 'escribir'],
        grammarAccuracy: Math.round(accuracy),
        speakingFluency: Math.round(accuracy * 0.8),
        writingLevel: level,
        listeningLevel: level,
        readingLevel: level,
        weakTopics,
        strongTopics,
        streak: 1,
        lastActive: new Date().toISOString(),
      };

      onComplete(generatedProfile, feedback);
    } catch (err) {
      console.error(err);
      setError('Sonuçlar hesaplanırken bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-slate-800">Seviye Belirleme Testi Hazırlanıyor...</h3>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
          Yapay zeka, dilbilgisi tuzaklarını içeren kişiselleştirilmiş 10 soruluk bir test hazırlıyor.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center bg-red-50 border border-red-200 rounded-2xl max-w-md mx-auto my-8">
        <p className="text-red-700 font-medium mb-4">{error}</p>
        <button
          onClick={fetchQuestions}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow transition-all"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-8">
        <p className="text-slate-600 mb-4">Soru yüklenemedi.</p>
        <button
          onClick={fetchQuestions}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div id="placement-test" className="max-w-2xl mx-auto bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl mt-6">
      {/* Progress Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-600 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Seviye Teşhis Analizi ({currentIdx + 1} / {questions.length})
          </span>
        </div>
        <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Canvas */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-snug mb-4">
          {currentQuestion.question}
        </h2>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-3 mt-6">
          {currentQuestion.options?.map((option, i) => {
            const isSelected = selectedAnswer === option;
            return (
              <button
                key={i}
                onClick={() => setSelectedAnswer(option)}
                className={`w-full text-left p-4 rounded-2xl border transition-all text-sm font-medium ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 shadow-sm'
                    : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border text-xs ${
                    isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 text-slate-400 bg-white'
                  }`}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action footer */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-100">
        <button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border ${
            currentIdx === 0
              ? 'border-slate-100 text-slate-300 cursor-not-allowed'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Önceki
        </button>

        <div className="flex gap-2">
          {currentQuestion.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 transition-all"
              title="Gramatik ipucu"
            >
              <Info className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!selectedAnswer || submitting}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg flex items-center gap-2 transition-all"
          >
            {submitting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Hesaplanıyor...
              </>
            ) : currentIdx === questions.length - 1 ? (
              <>
                Testi Bitir
                <Sparkles className="w-4 h-4" />
              </>
            ) : (
              <>
                Sonraki Soru
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hint Alert */}
      {showHint && currentQuestion.hint && (
        <div className="mt-4 p-4 bg-amber-50/70 border border-amber-100 rounded-2xl flex gap-3 text-sm text-amber-800 animate-fade-in">
          <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-900">Mantıksal İpucu:</span>{' '}
            {currentQuestion.hint}
          </div>
        </div>
      )}
    </div>
  );
}
