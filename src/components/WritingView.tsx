import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { FileText, Sparkles, Check, ChevronRight, Loader, AlertCircle } from 'lucide-react';

interface WritingViewProps {
  profile: UserProfile;
}

interface EvaluationResult {
  score: number;
  feedback: string;
  errors: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
  modelTranslation: {
    spanish: string;
    turkish: string;
  };
}

export default function WritingView({ profile }: WritingViewProps) {
  const [prompt, setPrompt] = useState('');
  const [submission, setSubmission] = useState('');
  const [loading, setLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    generatePrompt();
  }, [profile.cefrLevel]);

  const generatePrompt = () => {
    const level = profile.cefrLevel;
    const prompts: Record<string, string[]> = {
      A0: [
        'Kendinizi tanıtan kısa bir paragraf yazın. (Adınız, yaşınız, nereli olduğunuz ve ne iş yaptığınızı içermeli)',
        'Sevdiğiniz 5 meyveyi ve renklerini açıklayan basit birer cümle kurun.',
      ],
      A1: [
        'Evinizi ve odanızı tarif eden kısa bir e-posta yazın. (En az 40 kelime)',
        'Haftalık rutininizi anlatan basit bir paragraf yazın (Örn: Hangi günler çalışıyorsunuz, boş zamanlarınızda ne yaparsınız).'
      ],
      A2: [
        'İspanya seyahatindeki bir arkadaşınıza son tatilinizi anlatan bir mektup yazın. (En az 60 kelime, geçmiş zaman formlarını kullanın - Indefinido)',
        'Gelecekteki hayalinizdeki işi ve neden bu işi istediğinizi anlatan bir yazı hazırlayın.'
      ],
      B1: [
        'Çevre kirliliği ve geri dönüşümün önemi hakkında kişisel görüşlerinizi içeren bir kompozisyon taslağı oluşturun. (Subjuntivo kullanmaya özen gösterin)',
        'Çok beğendiğiniz bir filmi veya kitabı özetleyerek karakter analizini yapın.'
      ],
      B2: [
        'Şirket müdürünüze, çalışma saatlerinin esnetilmesi talebini içeren resmi bir e-posta yazın. (DELE B2 formatına uygun, resmi dil kurallarına sadık kalınarak en az 150 kelime)',
        'Sosyal medyanın gençlerin üzerindeki psikolojik etkilerini tartışan analitik bir makale hazırlayın.'
      ],
      C1: [
        'DELE C1 Sınavı Yazma Görevi (Tarea 1): Yapay zekanın iş gücü piyasasındaki geleceğini ve etik tartışmaları analiz eden, veri ve kişisel tezlerinizi savunan akademik düzeyde bir deneme kaleme alın. (En az 250 kelime)'
      ]
    };

    const choices = prompts[level] || prompts['A1'];
    setPrompt(choices[Math.floor(Math.random() * choices.length)]);
    setSubmission('');
    setEvalResult(null);
  };

  const handleEvaluate = async () => {
    if (!submission.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/writing/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: prompt,
          submission: submission,
          cefrLevel: profile.cefrLevel
        }),
      });

      if (!res.ok) throw new Error('Kompozisyon değerlendirilemedi.');
      const data = await res.json();
      setEvalResult(data);
    } catch (err) {
      console.error(err);
      alert('Değerlendirme alınırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Prompt Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md">
        <div className="flex items-center gap-2 text-indigo-600 mb-3">
          <FileText className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Aktif Yazma Görevi (CEFR {profile.cefrLevel})</span>
        </div>
        <h3 className="text-base md:text-lg font-bold text-slate-800 leading-snug">{prompt}</h3>
        <button
          onClick={generatePrompt}
          className="text-xs text-indigo-600 font-semibold hover:underline mt-3 flex items-center gap-1"
        >
          Farklı Bir Konu Getir <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Console */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-lg space-y-4">
        <h4 className="font-bold text-slate-800 text-sm">Kompozisyon / Metin Alanı</h4>
        <textarea
          value={submission}
          onChange={(e) => setSubmission(e.target.value)}
          placeholder="İspanyolca metninizi buraya yazın..."
          className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 font-sans leading-relaxed"
          disabled={loading}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Kelime Sayısı: {submission.split(/\s+/).filter(Boolean).length}</span>
          <button
            onClick={handleEvaluate}
            disabled={!submission.trim() || loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                AI Değerlendiriyor...
              </>
            ) : (
              <>
                Eğitmene Gönder
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Evaluation Result View */}
      {evalResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {/* Main Assessment & Score */}
          <div className="md:col-span-1 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-lg flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase text-indigo-300 tracking-wider">Değerlendirme Skoru</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">{evalResult.score}</span>
                <span className="text-indigo-300 text-sm">/ 100</span>
              </div>
              <div className="h-2 w-full bg-indigo-950 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${evalResult.score}%` }}></div>
              </div>
            </div>
            
            <div className="mt-6 border-t border-indigo-900 pt-6">
              <h5 className="font-bold text-sm text-indigo-200 mb-2">Eğitmen Geri Bildirimi:</h5>
              <p className="text-xs leading-relaxed text-indigo-100">{evalResult.feedback}</p>
            </div>
          </div>

          {/* Grammar Errors & comparative logic */}
          <div className="md:col-span-2 space-y-6">
            {/* Error logs */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Hata & Düzeltme Günlüğü</h4>
              {evalResult.errors && evalResult.errors.length > 0 ? (
                <div className="space-y-4">
                  {evalResult.errors.map((err, idx) => (
                    <div key={idx} className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded line-through">{err.original}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {err.corrected}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans pt-1">
                        <span className="font-semibold text-amber-950">Mantık Açıklaması:</span> {err.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm">
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium">Harika! Yazınızda hiçbir gramer hatası tespit edilmedi.</span>
                </div>
              )}
            </div>

            {/* Perfect model version */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Model / Kusursuz Örnek Sürüm</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <p className="text-sm font-medium text-slate-900 leading-relaxed italic">"{evalResult.modelTranslation.spanish}"</p>
                <div className="border-t border-slate-200/50 pt-2 text-xs text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700 block mb-0.5">Türkçe Karşılığı:</span>
                  "{evalResult.modelTranslation.turkish}"
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
