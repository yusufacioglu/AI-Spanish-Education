import React from 'react';
import { UserProfile, VocabWord } from '../types';
import { Award, Target, Flame, Layers, TrendingUp, BookOpen, ThumbsUp, AlertTriangle } from 'lucide-react';

interface StatsViewProps {
  profile: UserProfile;
  vocab: VocabWord[];
  onUpdateProfile: (p: UserProfile) => void;
}

export default function StatsView({ profile, vocab, onUpdateProfile }: StatsViewProps) {
  // Calculate vocab stats
  const activeCount = vocab.filter(w => w.box >= 4).length;
  const passiveCount = vocab.filter(w => w.box < 4).length;

  const ydsProgress = Math.round((profile.grammarAccuracy * 0.9 + 10)); // rough calculation
  const deleLevelIndex = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'].indexOf(profile.cefrLevel);
  const deleProgress = Math.round((deleLevelIndex / 5) * 100);

  const handleResetProfile = () => {
    if (confirm('Öğrenme profilinizi sıfırlamak istediğinize emin misiniz? Tüm kelimeleriniz ve istatistikleriniz silinecektir.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Target Progress Bar Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* YDS Target Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Akademik Hedef</span>
              <h3 className="text-base font-bold text-slate-800">YDS İspanyolca (75+ Barajı)</h3>
            </div>
            <Target className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Mevcut Seviye Tahmini</span>
              <span className="text-indigo-600 font-extrabold">{ydsProgress} / 100</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ydsProgress)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* DELE Target Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Uluslararası Hedef</span>
              <h3 className="text-base font-bold text-slate-800">DELE C1 Sertifikasyonu</h3>
            </div>
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">CEFR Aşama İlerlemesi</span>
              <span className="text-emerald-600 font-extrabold">{profile.cefrLevel} (Mevcut)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${deleProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak counter */}
        <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-orange-100 rounded-xl text-orange-600 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Çalışma Serisi</span>
            <p className="text-lg font-bold text-slate-800">{profile.streak} Gün</p>
          </div>
        </div>

        {/* Active Words */}
        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aktif Kelimeler</span>
            <p className="text-lg font-bold text-slate-800">{activeCount + profile.activeWords.length} Adet</p>
          </div>
        </div>

        {/* Passive words */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-slate-100 rounded-xl text-slate-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Öğrenilen Kelimeler</span>
            <p className="text-lg font-bold text-slate-800">{passiveCount + profile.passiveWords.length} Adet</p>
          </div>
        </div>

        {/* Grammar Accuracy */}
        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gramer Doğruluğu</span>
            <p className="text-lg font-bold text-slate-800">%{profile.grammarAccuracy}</p>
          </div>
        </div>
      </div>

      {/* Weakest and Strongest logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strong Topics log */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <ThumbsUp className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">En Güçlü Alanlar (Konular)</h3>
          </div>
          {profile.strongTopics && profile.strongTopics.length > 0 ? (
            <div className="space-y-2">
              {profile.strongTopics.slice(0, 5).map((topic, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 bg-emerald-50/40 border border-emerald-100/30 rounded-xl text-xs font-semibold text-emerald-900">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Egzersizleri başarıyla tamamladıkça güçlü alanlarınız listelenecektir.</p>
          )}
        </div>

        {/* Weak Topics log */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">En Zayıf Alanlar (Tekrar Listesi)</h3>
          </div>
          {profile.weakTopics && profile.weakTopics.length > 0 ? (
            <div className="space-y-2">
              {profile.weakTopics.slice(0, 5).map((topic, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2 bg-red-50/50 border border-red-100/30 rounded-xl text-xs font-semibold text-red-950">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Hatalarınız tespit edildikçe, adaptif derslerin odaklanması için buraya eklenecektir.</p>
          )}
        </div>
      </div>

      {/* Reset Engine Control Panel */}
      <div className="bg-red-50/40 border border-red-100 rounded-3xl p-6 text-center shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-red-950">Öğrenme Profili Sıfırlama</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
          Eğer seviyenizi yeniden ölçmek, tüm kelime geçmişini temizlemek ve Placement Test'i tekrarlamak isterseniz sistemi sıfırlayabilirsiniz.
        </p>
        <button
          onClick={handleResetProfile}
          className="px-6 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-extrabold rounded-xl transition-all shadow"
        >
          Tüm Sistemi Sıfırla (Reset Engine)
        </button>
      </div>
    </div>
  );
}
