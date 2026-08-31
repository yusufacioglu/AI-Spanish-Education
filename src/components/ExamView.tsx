import React, { useState, useEffect } from 'react';
import { ExamSimulation, Exercise, UserProfile } from '../types';
import { Trophy, Timer, FileText, Sparkles, AlertCircle, Loader, HelpCircle } from 'lucide-react';

interface ExamViewProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

export default function ExamView({ profile, onUpdateProfile }: ExamViewProps) {
  const [examType, setExamType] = useState<'YDS' | 'DELE'>('YDS');
  const [exam, setExam] = useState<ExamSimulation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulation play state
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [writingSubmissions, setWritingSubmissions] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  // Results
  const [results, setResults] = useState<{
    score: number;
    feedback: string;
    levelEstimate: string;
    weakAreas: string[];
  } | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      handleSubmitExam();
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const startSimulation = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults(null);
      setAnswers({});
      setWritingSubmissions({});
      setActiveSectionIdx(0);

      const level = examType === 'DELE' ? 'C1' : 'B2';

      const res = await fetch('/api/exam/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examType, level }),
      });
      if (!res.ok) throw new Error('Sınav simülasyonu üretilemedi.');
      const data = await res.json();
      setExam(data);
      
      // Set timer (e.g. 10 minutes for this quick condensed mock)
      setTimeLeft(600); 
      setIsActive(true);
    } catch (err: any) {
      setError(err.message || 'Sınav hazırlanırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmitExam = async () => {
    if (!exam) return;
    setIsActive(false);
    setEvaluating(true);

    try {
      // Calculate scores for multiple choice
      let totalQuestions = 0;
      let correctAnswersCount = 0;

      exam.sections.forEach(sec => {
        if (sec.type !== 'writing') {
          sec.exercises.forEach(ex => {
            totalQuestions++;
            if (answers[ex.id]?.trim().toLowerCase() === ex.correctAnswer.trim().toLowerCase()) {
              correctAnswersCount++;
            }
          });
        }
      });

      const mcqScore = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 100;
      let writingScore = 100;

      // Evaluate writing if it exists
      const writingEx = exam.sections.find(s => s.type === 'writing')?.exercises[0];
      if (writingEx && writingSubmissions[writingEx.id]) {
        const submission = writingSubmissions[writingEx.id];
        const res = await fetch('/api/writing/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: writingEx.question,
            submission,
            cefrLevel: exam.level
          })
        });
        if (res.ok) {
          const evalData = await res.json();
          writingScore = evalData.score;
        }
      }

      // Aggregate final score
      const finalScore = Math.round((mcqScore + writingScore) / 2);
      
      let levelEstimate = profile.cefrLevel;
      let feedback = '';
      let weakAreas: string[] = [];

      if (examType === 'YDS') {
        const ydsEquivalent = Math.round(finalScore * 0.9 + 10); // rough conversion
        feedback = `YDS İspanyolca simülasyonunu tamamladınız. Tahmini YDS puanınız: ${ydsEquivalent}/100. `;
        if (ydsEquivalent >= 75) {
          feedback += 'Mükemmel! 75+ olan hedef puan barajını başarıyla aşıyorsunuz. Kelime dağarcığını zenginleştirmeye devam edin.';
          levelEstimate = 'B2';
        } else {
          feedback += 'Hedef puanınız olan 75+ barajına yaklaşıyorsunuz. Gramer ve kelime bilginizi pekiştirecek günlük adaptif dersleri tamamlamaya devam edin.';
          levelEstimate = 'B1';
        }
        weakAreas = finalScore < 70 ? ['YDS Paragraf Çevirileri', 'İleri Seviye Prepozisyonlar'] : ['Zaman Uyumları (Concordancia de Tiempos)'];
      } else {
        // DELE C1
        if (finalScore >= 60) {
          feedback = 'DELE C1 sınav standardına göre APTO (Geçer) düzeyindesiniz. Yazma ve okuduğunu anlama becerileriniz üst düzeyde!';
          levelEstimate = 'C1';
        } else {
          feedback = 'DELE C1 standardına göre NO APTO (Yetersiz) seviyesindesiniz. C1 seviyesine çıkmak için özellikle Subjuntivo ve bağlaç (conectores) konularına ağırlık vermeliyiz.';
          levelEstimate = 'B2';
        }
        weakAreas = finalScore < 60 ? ['DELE C1 Yazılı Anlatım', 'Subjuntivo Imperfecto / Pluscuamperfecto'] : ['Akademik Kelime Dağarcığı'];
      }

      setResults({
        score: finalScore,
        feedback,
        levelEstimate,
        weakAreas
      });

      // Update user profile dynamically
      onUpdateProfile({
        ...profile,
        cefrLevel: levelEstimate,
        weakTopics: [...new Set([...profile.weakTopics, ...weakAreas])],
        grammarAccuracy: Math.round((profile.grammarAccuracy + finalScore) / 2)
      });

    } catch (err) {
      console.error(err);
      alert('Sınav hesaplanırken bir hata oluştu.');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-slate-800">Mock Sınav Paketi Yükleniyor...</h3>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
          Seçilen sınav standartlarına uygun (YDS / DELE C1) güncel, tuzaklı soru kalıpları derleniyor.
        </p>
      </div>
    );
  }

  if (evaluating) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-slate-800">Cevaplar Yapay Zekayla Değerlendiriliyor...</h3>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
          DELE sınav koçu ve YDS uzmanı modülleri, yazım, anlam ve dilbilgisi kurallarını analiz ediyor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Selection / Lobby area */}
      {!isActive && !results && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl max-w-2xl mx-auto text-center space-y-6">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Akademik Sınav Simülatörü</h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Öğrenim seviyenizi ölçmek ve hedeflerinize ulaşmak için gerçek DELE C1 veya YDS İspanyolca sınav formatlarını simüle edin.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => setExamType('YDS')}
              className={`px-6 py-3.5 rounded-2xl font-bold border transition-all text-sm flex-1 ${
                examType === 'YDS'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              YDS İspanyolca (75+ Hedef)
            </button>
            
            <button
              onClick={() => setExamType('DELE')}
              className={`px-6 py-3.5 rounded-2xl font-bold border transition-all text-sm flex-1 ${
                examType === 'DELE'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              DELE C1 Sınavı
            </button>
          </div>

          <button
            onClick={startSimulation}
            className="w-full py-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white hover:opacity-90 font-bold rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2"
          >
            Simülasyonu Başlat (Süreli)
          </button>
        </div>
      )}

      {/* Active Exam view */}
      {isActive && exam && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Question Sheet */}
          <div className="lg:col-span-3 space-y-6 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-lg">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="font-extrabold text-slate-800 text-base md:text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                {exam.sections[activeSectionIdx].title}
              </h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl uppercase">
                Bölüm {activeSectionIdx + 1} / {exam.sections.length}
              </span>
            </div>

            {/* Passage if exists */}
            {exam.sections[activeSectionIdx].passage && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-sm md:text-base leading-relaxed text-slate-700 italic">
                {exam.sections[activeSectionIdx].passage}
              </div>
            )}

            {/* Exercises List */}
            <div className="space-y-8 mt-6">
              {exam.sections[activeSectionIdx].exercises.map((ex, idx) => (
                <div key={ex.id} className="space-y-4">
                  <p className="font-bold text-slate-800 text-sm md:text-base">Soru {idx + 1}: {ex.question}</p>
                  
                  {ex.type === 'multiple-choice' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ex.options?.map((opt, oIdx) => {
                        const isSelected = answers[ex.id] === opt;
                        return (
                          <button
                            key={oIdx}
                            onClick={() => handleSelectOption(ex.id, opt)}
                            className={`p-3 text-left rounded-xl border text-xs md:text-sm transition-all ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-sm'
                                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <span className="font-mono font-bold mr-2 text-slate-400">{String.fromCharCode(65 + oIdx)})</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={writingSubmissions[ex.id] || ''}
                        onChange={(e) => setWritingSubmissions(prev => ({ ...prev, [ex.id]: e.target.value }))}
                        placeholder="İspanyolca cevabınızı veya kompozisyonunuzu buraya girin..."
                        className="w-full h-44 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
              <button
                disabled={activeSectionIdx === 0}
                onClick={() => setActiveSectionIdx(prev => prev - 1)}
                className="px-5 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40"
              >
                Önceki Bölüm
              </button>

              {activeSectionIdx < exam.sections.length - 1 ? (
                <button
                  onClick={() => setActiveSectionIdx(prev => prev + 1)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all"
                >
                  Sonraki Bölüm
                </button>
              ) : (
                <button
                  onClick={handleSubmitExam}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  Sınavı Bitir ve Gönder
                </button>
              )}
            </div>
          </div>

          {/* Sidebar Status & Timer */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timer card */}
            <div className="bg-gradient-to-br from-indigo-950 to-slate-950 text-white rounded-3xl p-6 shadow-md border border-indigo-500/10 flex flex-col items-center justify-center text-center space-y-2">
              <Timer className="w-8 h-8 text-indigo-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Kalan Süre</span>
              <span className="text-3xl font-extrabold tracking-tight font-mono">{formatTime(timeLeft)}</span>
            </div>

            {/* Quick overview of answers */}
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-md space-y-3">
              <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Soru Durumu</h3>
              <div className="space-y-2">
                {exam.sections.map((sec, sIdx) => (
                  <div key={sec.id} className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500">Bölüm {sIdx + 1}</span>
                    <div className="flex flex-wrap gap-2">
                      {sec.exercises.map((ex, idx) => {
                        const isAnswered = ex.type === 'multiple-choice' ? !!answers[ex.id] : !!writingSubmissions[ex.id];
                        return (
                          <div
                            key={ex.id}
                            className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center border transition-all ${
                              isAnswered ? 'bg-indigo-50 border-indigo-400 text-indigo-700 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Scorecard */}
      {results && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xl max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-2 border-b border-slate-100 pb-6">
            <Trophy className="w-12 h-12 text-amber-500 mx-auto" />
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">Sınav Sonuç Değerlendirme Raporu</h2>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Simülasyon Türü: {examType}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Score block */}
            <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl flex flex-col justify-between shadow-md">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Doğruluk / Başarı Oranı</span>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-5xl font-extrabold">{results.score}%</span>
                <span className="text-indigo-300 text-xs">Genel Başarı</span>
              </div>
              <p className="text-xs text-indigo-100 leading-relaxed italic">"{results.feedback}"</p>
            </div>

            {/* Estimated metrics */}
            <div className="p-6 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col justify-between shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kazanılan Seviye Çıkarımı</span>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-slate-900">CEFR {results.levelEstimate}</span>
                <p className="text-xs text-slate-500 mt-1">Yapay Zeka CEFR Tespit Motoru Çıkarımı</p>
              </div>
              <div className="border-t border-slate-200/60 pt-3">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">İyileştirilmesi Gereken 1 Numaralı Konu</span>
                <p className="text-xs text-indigo-600 font-bold mt-1">{results.weakAreas[0] || 'Genel gramer uyumları'}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setResults(null)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow transition-all text-center block"
          >
            Sınav Merkezine Dön
          </button>
        </div>
      )}
    </div>
  );
}
