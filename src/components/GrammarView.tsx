import React, { useState } from 'react';
import { HelpCircle, Sparkles, Check, X, ShieldAlert } from 'lucide-react';

interface GrammarTopic {
  id: string;
  title: string;
  concept: string;
  turkishContrast: string;
  logic: string;
  example: string;
  exampleTranslation: string;
  quickQuestion: {
    question: string;
    options: string[];
    correct: string;
    explanation: string;
  };
}

export default function GrammarView() {
  const [selectedTopic, setSelectedTopic] = useState<string>('ser_estar');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [answered, setAnswered] = useState(false);

  const topics: GrammarTopic[] = [
    {
      id: 'ser_estar',
      title: 'Ser ve Estar Farkı (Var Olma Mantığı)',
      concept: 'Türkçedeki "-dir" eki veya "olmak" eylemi İspanyolcada iki farklı fiile bölünür.',
      turkishContrast: 'Türkçede "Ben öğretmenim" ve "Ben mutluyum" cümlelerinde yüklem ekleri aynıdır (-im). Ancak İspanyolca bu iki yüklemi felsefi düzeyde ayırır.',
      logic: 'SER, bir nesnenin veya kişinin özünü, kalıcı kimliğini ifade eder (İsim, meslek, milliyet, fiziksel özellik). ESTAR ise geçici durumları, duyguları veya fiziksel konumu belirtir.',
      example: 'Soy profesor (Öğretmenim - Kalıcı kimliğim). Estoy cansado (Yorgunum - Geçici durumum).',
      exampleTranslation: 'Soy (Ser) vs Estoy (Estar)',
      quickQuestion: {
        question: '¿Cómo se dice "Evdeyim" en español?',
        options: ['Soy en casa', 'Estoy en casa', 'Tengo en casa', 'Siento en casa'],
        correct: 'Estoy en casa',
        explanation: 'Evde bulunmak geçici ve mekansal bir durumdur. Bu yüzden konum belirtirken her zaman "Estar" (Estoy) kullanılır.'
      }
    },
    {
      id: 'por_para',
      title: 'Por ve Para (Yön / Neden İlişkisi)',
      concept: 'Türkçedeki "-için" edatı İspanyolcada iki ayrı edatla ("Por" ve "Para") karşılanır.',
      turkishContrast: 'Türkçede "Senin için aldım" ile "Hastalık için gidemedim" ifadelerinde "-için" kullanılır. Ancak İspanyolca bunları yön/hedef ve neden/gerekçe olarak ayırır.',
      logic: 'PARA, nihai hedefleri, alıcıları, son teslim tarihlerini veya yönleri belirtir. POR ise nedenleri, gerekçeleri, araçları (ile), değişimleri (para ödeme) veya geçiş yollarını ifade eder.',
      example: 'Lo compré para ti (Bunu senin için aldım - Hedef sensin). No fui por la lluvia (Yağmur yüzünden/için gidemedim - Sebep yağmur).',
      exampleTranslation: 'Para (Hedef) vs Por (Sebep)',
      quickQuestion: {
        question: 'Completa: Gracias ____ la ayuda. (Yardım için teşekkürler.)',
        options: ['para', 'por', 'de', 'con'],
        correct: 'por',
        explanation: 'Burada teşekkürün gerekçesi/sebebi belirtilmektedir. Sebepler ve teşekkür gerekçeleri için "Por" kullanılır.'
      }
    },
    {
      id: 'subjuntivo',
      title: 'Subjuntivo (Dilek-Şart Kipinin Mantığı)',
      concept: 'DELE C1 ve YDS için en önemli konulardan biridir. Nesnel gerçeklik dışındaki hayaller, şüpheler ve istekler kipidir.',
      turkishContrast: 'Türkçedeki "-meni istiyorum", "-mesini umuyorum" gibi isim-fiil ve dilek-şart yapılarının İspanyolca karşılığıdır.',
      logic: 'İspanyolcada zihin iki bölmeye ayrılır: Indicativo (Gerçekler dünyası) ve Subjuntivo (İstek, duygu, şüphe, belirsizlik dünyası). Ana cümle bir duygu veya istek belirtiyorsa, yan cümle Subjuntivo alır.',
      example: 'Espero que vengas (Gelmeni umuyorum - Gelip gelmeyeceğin kesin değil, bir istek/beklenti).',
      exampleTranslation: 'Espero (İstiyorum) + que + vengas (Subjuntivo)',
      quickQuestion: {
        question: 'Completa: Quiero que tú ____ (estudiar) español.',
        options: ['estudias', 'estudies', 'estudiar', 'estudiará'],
        correct: 'estudies',
        explanation: 'Quiero que... (İstiyorum ki...) yapısı karşı taraftan bir talep/istek belirttiği için yan cümle Subjuntivo (estudies) çekiminde olmalıdır.'
      }
    }
  ];

  const currentTopic = topics.find(t => t.id === selectedTopic)!;

  const handleSelectOption = (opt: string) => {
    setUserAnswer(opt);
    setAnswered(true);
  };

  const handleTabChange = (id: string) => {
    setSelectedTopic(id);
    setUserAnswer('');
    setAnswered(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 space-y-2 bg-white border border-slate-100 p-4 rounded-3xl shadow-md h-fit">
        <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider px-3 mb-3">Mantık Rehberleri</h3>
        {topics.map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold transition-all ${
              selectedTopic === t.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* Logic Card & Practice Question */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-lg space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h1 className="text-lg md:text-xl font-bold text-slate-800">{currentTopic.title}</h1>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kavram Özeti</span>
              <p className="text-sm font-semibold text-slate-700 mt-1 leading-relaxed">{currentTopic.concept}</p>
            </div>

            <div className="p-4 bg-indigo-50/40 border border-indigo-100/30 rounded-2xl">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Türkçeyle Karşılaştırmalı Mantık</span>
              <p className="text-xs md:text-sm text-indigo-950 mt-1.5 leading-relaxed">{currentTopic.turkishContrast}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Altında Yatan Formülasyon Mantığı</span>
              <p className="text-xs md:text-sm text-slate-600 mt-1 whitespace-pre-line leading-relaxed">{currentTopic.logic}</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl font-mono text-xs md:text-sm">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Cümle Çözümlemesi</span>
              <p className="text-slate-800 font-bold">{currentTopic.example}</p>
              <p className="text-slate-500 italic mt-0.5">{currentTopic.exampleTranslation}</p>
            </div>
          </div>
        </div>

        {/* Quick Test */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-lg space-y-4">
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Hızlı Kavrama Testi
          </h3>
          <p className="font-semibold text-slate-700 text-sm md:text-base">{currentTopic.quickQuestion.question}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {currentTopic.quickQuestion.options.map((opt, i) => {
              const isSelected = userAnswer === opt;
              const isCorrect = opt === currentTopic.quickQuestion.correct;
              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => handleSelectOption(opt)}
                  className={`p-3 text-left rounded-xl border text-xs md:text-sm transition-all ${
                    answered
                      ? isCorrect
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                        : isSelected
                        ? 'bg-red-50 border-red-400 text-red-900 font-bold'
                        : 'bg-white border-slate-100 text-slate-400'
                      : isSelected
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className={`p-4 rounded-xl text-xs flex gap-2 ${
              userAnswer === currentTopic.quickQuestion.correct ? 'bg-emerald-50/50 text-emerald-800' : 'bg-red-50/50 text-red-800'
            }`}>
              {userAnswer === currentTopic.quickQuestion.correct ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block mb-0.5">
                  {userAnswer === currentTopic.quickQuestion.correct ? 'Doğru Cevap!' : 'Hatalı Seçim'}
                </span>
                {currentTopic.quickQuestion.explanation}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
