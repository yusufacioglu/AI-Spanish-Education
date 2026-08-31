export type CEFRLevel = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface UserProfile {
  cefrLevel: CEFRLevel;
  totalWords: number;
  activeWords: string[];
  passiveWords: string[];
  grammarAccuracy: number; // 0 - 100 %
  speakingFluency: number; // 0 - 100 %
  writingLevel: CEFRLevel;
  listeningLevel: CEFRLevel;
  readingLevel: CEFRLevel;
  weakTopics: string[];
  strongTopics: string[];
  streak: number;
  lastActive: string; // ISO string
}

export interface SessionHistoryItem {
  id: string;
  date: string; // ISO string
  type: 'placement' | 'lesson' | 'speaking' | 'writing' | 'listening' | 'reading' | 'vocab' | 'grammar' | 'exam';
  title: string;
  score?: number; // percentage or score
  maxScore?: number;
  feedback: string;
}

export interface VocabWord {
  id: string;
  word: string;
  translation: string;
  context: string;
  level: CEFRLevel;
  box: number; // 1 to 5 for Spaced Repetition (1 day, 3 days, 7 days, 14 days, 30 days)
  nextReviewDate: string; // ISO string
  lastReviewedDate?: string;
  correctCount: number;
  incorrectCount: number;
}

export interface ExampleSentence {
  spanish: string;
  turkish: string;
  explanation?: string;
}

export interface VocabItem {
  word: string;
  translation: string;
  pronunciation?: string;
}

export interface Exercise {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'translate' | 'writing';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string; // Exact match or expected input
  hint?: string;
}

export interface DynamicLesson {
  id: string;
  title: string;
  level: CEFRLevel;
  topic: string;
  explanation: string; // In Turkish, focusing on logic
  examples: ExampleSentence[];
  vocabulary: VocabItem[];
  exercises: Exercise[];
}

export interface ReadingText {
  id: string;
  title: string;
  level: CEFRLevel;
  content: string; // Spanish text
  translation: string; // Full Turkish translation
  vocabulary: VocabItem[];
  comprehensionQuestions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export interface ExamSimulation {
  id: string;
  title: string;
  type: 'DELE' | 'YDS';
  level: CEFRLevel;
  sections: {
    id: string;
    title: string;
    type: 'reading' | 'grammar' | 'listening' | 'writing';
    instructions: string;
    passage?: string; // For reading/listening
    listeningText?: string; // Text to be read out via TTS
    exercises: Exercise[];
  }[];
}
