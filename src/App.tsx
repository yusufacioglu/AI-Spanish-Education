import React, { useState, useEffect } from 'react';
import { UserProfile, VocabWord } from './types';
import PlacementTest from './components/PlacementTest';
import LessonView from './components/LessonView';
import SpeakingView from './components/SpeakingView';
import WritingView from './components/WritingView';
import ReadingView from './components/ReadingView';
import VocabView from './components/VocabView';
import GrammarView from './components/GrammarView';
import ExamView from './components/ExamView';
import StatsView from './components/StatsView';
import VoiceSettingsModal from './components/VoiceSettingsModal';
import {
  Sparkles,
  BookOpen,
  MessageSquare,
  PenTool,
  Brain,
  Trophy,
  BarChart3,
  Flame,
  Bookmark,
  GraduationCap,
  History,
  AlertCircle,
  Menu,
  X,
  Volume2
} from 'lucide-react';

const LOCAL_PROFILE_KEY = 'sp_learning_profile_v2';
const LOCAL_VOCAB_KEY = 'sp_learning_vocab_v2';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vocab, setVocab] = useState<VocabWord[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [systemAlert, setSystemAlert] = useState<string | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem(LOCAL_PROFILE_KEY);
    const savedVocab = localStorage.getItem(LOCAL_VOCAB_KEY);

    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error(e);
      }
    }
    if (savedVocab) {
      try {
        setVocab(JSON.parse(savedVocab));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync to local storage
  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
  };

  const handleUpdateVocab = (newVocab: VocabWord[]) => {
    setVocab(newVocab);
    localStorage.setItem(LOCAL_VOCAB_KEY, JSON.stringify(newVocab));
  };

  // Diagnostic placement test callback
  const handlePlacementComplete = (newProfile: UserProfile, feedback: string) => {
    handleUpdateProfile(newProfile);
    setSystemAlert(feedback);
    setActiveTab('dashboard');
  };

  // Vocabulary handlers (SRS algorithm)
  const handleAddWord = (word: string, translation: string, context: string) => {
    const wordClean = word.trim();
    // Avoid double entries
    if (vocab.some(w => w.word.toLowerCase() === wordClean.toLowerCase())) {
      return;
    }

    const newWord: VocabWord = {
      id: `word_${Date.now()}`,
      word: wordClean,
      translation: translation.trim(),
      context: context.trim(),
      level: profile?.cefrLevel || 'A1',
      box: 1, // Start in box 1
      nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day interval
      correctCount: 0,
      incorrectCount: 0,
    };

    const updated = [newWord, ...vocab];
    handleUpdateVocab(updated);
  };

  const handleReviewWord = (wordId: string, correct: boolean) => {
    const now = Date.now();
    const updated = vocab.map(w => {
      if (w.id === wordId) {
        let nextBox = w.box;
        let correctCount = w.correctCount;
        let incorrectCount = w.incorrectCount;

        if (correct) {
          nextBox = Math.min(5, w.box + 1);
          correctCount++;
        } else {
          nextBox = 1; // Reset to Box 1 on mistake
          incorrectCount++;
        }

        // Calculate next review interval
        // Box 1: 1 day, Box 2: 3 days, Box 3: 7 days, Box 4: 14 days, Box 5: 30 days
        const days = nextBox === 1 ? 1 : nextBox === 2 ? 3 : nextBox === 3 ? 7 : nextBox === 4 ? 14 : 30;
        const nextReviewDate = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();

        return {
          ...w,
          box: nextBox,
          correctCount,
          incorrectCount,
          nextReviewDate,
          lastReviewedDate: new Date(now).toISOString()
        };
      }
      return w;
    });

    handleUpdateVocab(updated);
  };

  // Navigations items mapping
  const menuItems = [
    { id: 'dashboard', label: 'Eğitim Paneli', icon: GraduationCap },
    { id: 'lessons', label: 'Ders Motoru', icon: Brain },
    { id: 'speaking', label: 'Konuşma Pratiği', icon: MessageSquare },
    { id: 'writing', label: 'Yazma Atölyesi', icon: PenTool },
    { id: 'reading', label: 'Okuma & Dinleme', icon: BookOpen },
    { id: 'vocabulary', label: 'Kelime Kutusu', icon: Bookmark },
    { id: 'grammar', label: 'Dilbilgisi Mantığı', icon: Sparkles },
    { id: 'exams', label: 'Sınav Merkezi', icon: Trophy },
    { id: 'analytics', label: 'Gelişim Analitiği', icon: BarChart3 }
  ];

  return (
    <div id="app-root" className="min-h-screen bg-slate-950 flex flex-col font-sans antialiased text-slate-200 p-4 md:p-6 gap-6">
      {/* Upper Navigation Bar (Bento Panel) */}
      <header className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-red-900/40 tracking-wider">
            ES
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">ADAPTİF ÖĞRENME SİSTEMİ</span>
            <h1 className="text-base md:text-lg font-black tracking-tight text-slate-100 leading-none">LinguistAI Sistem</h1>
          </div>
        </div>

        {/* Profile Status & Voice Settings Widgets */}
        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950/60 px-3.5 py-1.5 rounded-full border border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0"></span>
                <span className="text-xs font-bold text-slate-300">CEFR Seviyesi: {profile.cefrLevel}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs bg-slate-950/60 px-3.5 py-1.5 rounded-full border border-slate-800">
                <Flame className="w-3.5 h-3.5 fill-current text-amber-500 animate-bounce" />
                <span>{profile.streak} Gün Seri</span>
              </div>
            </div>
          )}

          {/* Voice Settings Button */}
          <button
            onClick={() => setShowVoiceModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 text-rose-300 hover:text-rose-200 border border-rose-900/40 hover:border-rose-700/60 rounded-xl text-xs font-bold transition-all shadow-sm group"
            title="İnsan Benzeri Kadın Seslendirme Ayarları"
          >
            <Volume2 className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Ses Ayarları (Kadın Sesi)</span>
            <span className="sm:hidden">Ses</span>
          </button>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 relative">
        {/* Mobile slide-out nav drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex">
            <div className="bg-slate-900 w-72 h-full p-6 flex flex-col justify-between shadow-2xl border-r border-slate-800">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <h2 className="font-extrabold text-slate-100 text-sm tracking-wider">MENÜ</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                
                <nav className="space-y-1.5">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        disabled={!profile && item.id !== 'dashboard'}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                            : !profile
                            ? 'opacity-25 cursor-not-allowed text-slate-500'
                            : 'text-slate-400 hover:text-white hover:bg-slate-850'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {profile && (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between shadow-inner">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Mevcut Seviye</span>
                    <p className="text-sm font-bold text-slate-200">CEFR {profile.cefrLevel}</p>
                  </div>
                  <span className="p-2 bg-slate-900 border border-slate-800 text-amber-500 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm">
                    <Flame className="w-4 h-4 fill-current text-amber-500" /> {profile.streak} Gün
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar Navigation (Bento Panel) */}
        <aside className="hidden md:block w-72 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 shrink-0 h-[calc(100vh-140px)] sticky top-6 overflow-y-auto shadow-2xl">
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLocked = !profile && item.id !== 'dashboard';
              
              return (
                <button
                  key={item.id}
                  disabled={isLocked}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                      : isLocked
                      ? 'opacity-25 cursor-not-allowed text-slate-600'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850 border border-transparent hover:border-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {profile && (
            <div className="p-4.5 bg-slate-950/60 border border-slate-850 rounded-xl space-y-3 shadow-inner">
              <div className="space-y-1">
                <span className="text-[9px] text-red-500 font-extrabold uppercase tracking-wider">Gelişim Koçu Önerisi</span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bugün <span className="font-bold text-white">Ders Motoru</span> panelinden yeni bir konu öğrenip pekiştirme yapabilirsiniz.
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Central Work Canvas Area (Bento Main Container) */}
        <main className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 overflow-y-auto h-[calc(100vh-140px)] shadow-2xl flex flex-col justify-between">
          <div className="space-y-6 flex-1">
            {/* Custom interactive alerts */}
            {systemAlert && (
              <div className="mb-6 p-4 bg-indigo-950/40 border border-indigo-900 text-indigo-200 rounded-2xl text-xs md:text-sm flex gap-3 shadow-inner relative animate-fade-in">
                <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Eğitmen Analiz Raporu:</span> {systemAlert}
                </div>
                <button onClick={() => setSystemAlert(null)} className="absolute top-2 right-2.5 text-xs text-indigo-400 hover:text-indigo-200 font-bold">Kapat</button>
              </div>
            )}

            {/* Core router screens */}
            {!profile ? (
              <div className="space-y-6 max-w-2xl mx-auto my-6 text-center">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-red-950/40 border border-red-900 text-red-400 text-xs font-bold uppercase rounded-full">
                    Hoş Geldiniz
                  </span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight">Kişiselleştirilmiş Öğrenme Yolculuğunuza Başlayın</h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    Sistemin seviyenizi test edip ilk uyarlanabilir dersinizi tasarlayabilmesi için seviye teşhis testini tamamlayın.
                  </p>
                </div>
                <PlacementTest onComplete={handlePlacementComplete} />
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <div className="space-y-8 animate-fade-in">
                    {/* Dashboard Hero greeting card */}
                    <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                      <div className="space-y-2 max-w-xl">
                        <span className="text-[10px] font-extrabold text-amber-100 uppercase tracking-widest">Akademik Başarı Raporu</span>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">¡Hola de nuevo!</h2>
                        <p className="text-amber-50 text-xs md:text-sm leading-relaxed font-medium">
                          Yapay zeka dil edinim motoru, zayıf ve güçlü olduğunuz alanları gözlemleyerek size özel eğitim yollarını oluşturdu.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/20">
                        <div>
                          <span className="text-[10px] text-amber-100 uppercase font-bold tracking-wider">CEFR Seviyesi</span>
                          <p className="text-lg md:text-2xl font-black text-white">{profile.cefrLevel}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-100 uppercase font-bold tracking-wider">Gramer Başarısı</span>
                          <p className="text-lg md:text-2xl font-black text-white">%{profile.grammarAccuracy}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-100 uppercase font-bold tracking-wider">Toplam Kelime</span>
                          <p className="text-lg md:text-2xl font-black text-white">{vocab.length + profile.totalWords} Kelime</p>
                        </div>
                      </div>
                    </div>

                    {/* Daily task recommendation bento */}
                    <div className="space-y-4">
                      <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Bugün Önerilenler</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Task 1 */}
                        <div
                          onClick={() => setActiveTab('lessons')}
                          className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 hover:border-red-500 shadow-xl cursor-pointer transition-all flex items-start gap-4 hover:shadow-red-950/10"
                        >
                          <div className="p-3 bg-slate-900 border border-slate-800 text-red-500 rounded-xl shrink-0">
                            <Brain className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-100 text-sm md:text-base">Yeni Konuyu Keşfedin</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Yazılım, zayıf kaldığınız "{profile.weakTopics[0] || 'Genel Dilbilgisi'}" konusuna odaklanan yeni bir ders paketi hazırladı.
                            </p>
                          </div>
                        </div>

                        {/* Task 2 */}
                        <div
                          onClick={() => setActiveTab('speaking')}
                          className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 hover:border-red-500 shadow-xl cursor-pointer transition-all flex items-start gap-4 hover:shadow-red-950/10"
                        >
                          <div className="p-3 bg-slate-900 border border-slate-800 text-amber-500 rounded-xl shrink-0">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-100 text-sm md:text-base">Práctica Hablada (Sohbet)</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Eğitmen ile sadece İspanyolca konuşarak günlük pratik yapın, anında gramer uyarıları alın.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'lessons' && (
                  <LessonView
                    profile={profile}
                    onUpdateProfile={handleUpdateProfile}
                    onAddWord={handleAddWord}
                    savedWords={vocab}
                  />
                )}

                {activeTab === 'speaking' && (
                  <SpeakingView profile={profile} />
                )}

                {activeTab === 'writing' && (
                  <WritingView profile={profile} />
                )}

                {activeTab === 'reading' && (
                  <ReadingView
                    profile={profile}
                    onAddWord={handleAddWord}
                    savedWords={vocab}
                  />
                )}

                {activeTab === 'vocabulary' && (
                  <VocabView
                    words={vocab}
                    onReviewWord={handleReviewWord}
                  />
                )}

                {activeTab === 'grammar' && (
                  <GrammarView />
                )}

                {activeTab === 'exams' && (
                  <ExamView
                    profile={profile}
                    onUpdateProfile={handleUpdateProfile}
                  />
                )}

                {activeTab === 'analytics' && (
                  <StatsView
                    profile={profile}
                    vocab={vocab}
                    onUpdateProfile={handleUpdateProfile}
                  />
                )}
              </>
            )}
          </div>

          {/* Bento Footer */}
          <footer className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold tracking-wider text-slate-500">
            <span>LINGUISTAI ADAPTİF SİSTEM © 2026</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span> SİSTEM AKTİF</span>
          </footer>
        </main>
      </div>

      {/* Voice Settings & Model Customization Modal */}
      <VoiceSettingsModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
      />
    </div>
  );
}
