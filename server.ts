import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  generatePlacementTestFallback,
  generateAdaptiveLessonFallback,
  generateSpeakingChatFallback,
  generateWritingEvaluateFallback,
  generateReadingFallback,
  generateExamFallback
} from './src/fallbacks.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Set up server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// JSON body parser with generous limit for audio and image uploads if needed
app.use(express.json({ limit: '10mb' }));

// Helper to sanitize JSON response from Gemini
function cleanJsonText(text: string | undefined): string {
  if (!text) return '{}';
  // Remove markdown code fence if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/* ==========================================
   ENDPOINT 1: PLACEMENT TEST GENERATION
   ========================================== */
app.post('/api/placement/generate', async (req, res) => {
  try {
    const prompt = `You are a Spanish CEFR testing system. Generate 10 multiple-choice questions to evaluate a Turkish native speaker's Spanish level.
    The questions should range from A1 to B2 level (2x A1, 3x A2, 3x B1, 2x B2).
    Design questions that specifically test syntax, verbs, prepositions (like por vs para, ser vs estar), and subjunctive, which are commonly difficult for Turkish speakers.
    
    Each question must be a multiple choice with 4 options, a hint, and the correct answer.
    
    Return the response strictly as a JSON array of questions, adhering to this schema:
    [
      {
        "id": "q1",
        "type": "multiple-choice",
        "question": "The question text in Spanish, with a blank or prompt",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The exact string matching the correct option",
        "hint": "A helpful grammar tip written in Turkish"
      }
    ]`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = cleanJsonText(response.text);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.warn('Error generating placement test via Gemini, falling back to local generator:', error.message || error);
    try {
      const fallbackData = generatePlacementTestFallback();
      res.json(fallbackData);
    } catch (fallbackError: any) {
      res.status(500).json({ error: 'Failed to generate placement test' });
    }
  }
});

/* ==========================================
   ENDPOINT 2: ADAPTIVE LESSON GENERATION
   ========================================== */
app.post('/api/lesson/generate', async (req, res) => {
  try {
    const { cefrLevel, weakTopics, strongTopics, passiveWords } = req.body;

    const prompt = `You are an adaptive, elite Spanish teacher who teaches Spanish logically to Turkish native speakers.
    Generate a highly customized, custom-tailored lesson for a student with the following profile:
    - Current CEFR Level: ${cefrLevel || 'A1'}
    - Weak Topics to improve: ${JSON.stringify(weakTopics || [])}
    - Strong Topics: ${JSON.stringify(strongTopics || [])}
    - Words to practice/remember: ${JSON.stringify(passiveWords || [])}

    Your teaching philosophy is: NO MEMORIZATION. Explain the LOGIC behind the grammar rules and structures.
    Always compare Spanish with Turkish grammar (e.g., explain noun-adjective order, suffix logic vs prepositions, subject pronouns, ser/estar, por/para, subjunctive) to make it intuitive.

    The lesson must include:
    1. A catchy title.
    2. A clear grammar topic.
    3. An explanation section written in elegant Turkish, breaking down the logic.
    4. 3-4 highly relevant example sentences in Spanish, their Turkish translations, and a quick explanation of why that structure is used.
    5. 4-5 vocabulary items (VocabItem) related to the topic, showing Spanish word, Turkish translation, and a simple pronunciation hint in Turkish.
    6. 4-5 interactive exercises (mix of 'multiple-choice', 'fill-blank', and 'translate') to verify understanding.

    Return the response strictly as a JSON object matching this schema:
    {
      "id": "lesson_unique_id",
      "title": "Title in Turkish",
      "level": "${cefrLevel || 'A1'}",
      "topic": "Grammar Topic Name",
      "explanation": "Detailed explanation in Turkish. Explain the LOGIC, comparing with Turkish. Avoid dry rote learning.",
      "examples": [
        {
          "spanish": "Spanish sentence",
          "turkish": "Turkish translation",
          "explanation": "Explanation in Turkish of why this is phrased this way"
        }
      ],
      "vocabulary": [
        {
          "word": "palabra",
          "translation": "kelime",
          "pronunciation": "pah-lah-brah"
        }
      ],
      "exercises": [
        {
          "id": "ex_1",
          "type": "multiple-choice", // or 'fill-blank' or 'translate'
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"], // only for multiple-choice
          "correctAnswer": "The correct option or string",
          "hint": "Turkish hint focusing on grammar logic"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = cleanJsonText(response.text);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.warn('Error generating adaptive lesson via Gemini, falling back to local generator:', error.message || error);
    try {
      const { cefrLevel, weakTopics, strongTopics, passiveWords } = req.body;
      const fallbackData = generateAdaptiveLessonFallback(cefrLevel, weakTopics, strongTopics, passiveWords);
      res.json(fallbackData);
    } catch (fallbackError: any) {
      res.status(500).json({ error: 'Failed to generate lesson' });
    }
  }
});

/* ==========================================
   ENDPOINT 3: SPEAKING COMPANION (CHAT)
   ========================================== */
app.post('/api/speaking/chat', async (req, res) => {
  try {
    const { history, userMessage, cefrLevel } = req.body;

    // history is an array of { role: 'user'|'model', text: string }
    const formattedHistory = history ? history.map((h: any) => `${h.role === 'user' ? 'Student' : 'AI'}: ${h.text}`).join('\n') : '';

    const prompt = `You are a native Spanish conversational coach helping a Turkish student learn Spanish.
    The student's level is ${cefrLevel || 'A1'}. 
    
    You have two main tasks:
    1. Respond naturally in Spanish to the student's message. Keep the Spanish appropriate for their CEFR level (${cefrLevel}):
       - A1/A2: Simple, clear phrases, present tense, everyday situations.
       - B1/B2: Simple past, future, some conditional, and basic subjunctive.
       - C1: Natural, native speed, rich vocabulary, and idioms.
    2. Analyze the student's last message: "${userMessage}".
       If they made grammatical, structural, or lexical mistakes:
       - Explain the mistake kindly in Turkish.
       - Compare it with Turkish syntax to show why the mistake happened.
       - Provide the corrected version.
       If they made NO mistakes, praise them briefly in Turkish!

    Return your response strictly as a JSON object with this schema:
    {
      "reply": "Your natural Spanish response to keep the conversation going. Ask a friendly, relevant question to keep them talking.",
      "corrections": "Turkish explanation of any grammatical errors they made in their last message, with Turkish-Spanish comparisons. If none, write a praise sentence.",
      "hasError": true/false
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Conversation History:\n${formattedHistory}\n\nStudent's New Message: "${userMessage}"\n\nTask: Generate response in JSON.\n` + prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = cleanJsonText(response.text);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.warn('Error in speaking chat via Gemini, falling back to local generator:', error.message || error);
    try {
      const { history, userMessage, cefrLevel } = req.body;
      const fallbackData = generateSpeakingChatFallback(history, userMessage, cefrLevel);
      res.json(fallbackData);
    } catch (fallbackError: any) {
      res.status(500).json({ error: 'Failed to process chat' });
    }
  }
});

/* ==========================================
   ENDPOINT 4: WRITING ESSAY EVALUATION
   ========================================== */
app.post('/api/writing/evaluate', async (req, res) => {
  try {
    const { topic, submission, cefrLevel } = req.body;

    const prompt = `You are a CEFR Spanish writing evaluator and DELE coach.
    A student learning Spanish (level ${cefrLevel || 'A2'}) has written a short paragraph/essay/email about: "${topic}".
    
    Here is their submission:
    "${submission}"
    
    Provide an expert evaluation. Do the following:
    1. Assess the writing style, vocabulary, and grammar.
    2. Score the writing from 0 to 100%.
    3. Identify every single error. For each error, provide:
       - The wrong snippet.
       - The corrected snippet.
       - A detailed grammatical explanation in Turkish, explaining the underlying rule and comparing it logically with Turkish syntax (how the Turkish thought process translates to Spanish syntax).
    4. Provide an overall feedback text in Turkish with tips on how to improve.
    5. Draft a "Model/Perfect Version" of the essay in Spanish suitable for their current level but perfectly written, with Turkish translation of it.

    Return your response strictly as a JSON object matching this schema:
    {
      "score": 85, // Number out of 100
      "feedback": "Overall constructive feedback in Turkish",
      "errors": [
        {
          "original": "wrong snippet",
          "corrected": "corrected snippet",
          "explanation": "Why it was wrong, the logical Spanish rule, and Turkish comparison"
        }
      ],
      "modelTranslation": {
        "spanish": "The flawless, natural version in Spanish",
        "turkish": "The Turkish translation of the flawless version"
      }
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = cleanJsonText(response.text);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.warn('Error evaluating writing via Gemini, falling back to local generator:', error.message || error);
    try {
      const { topic, submission, cefrLevel } = req.body;
      const fallbackData = generateWritingEvaluateFallback(topic, submission, cefrLevel);
      res.json(fallbackData);
    } catch (fallbackError: any) {
      res.status(500).json({ error: 'Failed to evaluate writing' });
    }
  }
});

/* ==========================================
   ENDPOINT 5: READING TEXT GENERATION
   ========================================== */
app.post('/api/reading/generate', async (req, res) => {
  try {
    const { level, genre } = req.body; // level: CEFRLevel, genre: e.g. 'history', 'news', 'dialogue', 'story'

    const prompt = `You are a Spanish curriculum designer. Generate a reading passage and comprehension exercises for a Turkish speaker.
    - Level: ${level || 'A2'}
    - Genre/Style: ${genre || 'story'}

    The text must be interesting and appropriate for CEFR ${level}.
    In addition, select 5 useful/complex words from the text to highlight.
    Provide 3 reading comprehension multiple-choice questions with 4 options, the correct answer, and explanations in Turkish.

    Return the response strictly as a JSON object matching this schema:
    {
      "id": "reading_unique_id",
      "title": "A catchy title in Spanish",
      "level": "${level || 'A2'}",
      "content": "The full Spanish text of the reading passage (about 150-300 words depending on level)",
      "translation": "Flawless, line-by-line Turkish translation of the text",
      "vocabulary": [
        {
          "word": "Spanish word from the text",
          "translation": "Turkish definition",
          "pronunciation": "Turkish phonetic pronunciation hint"
        }
      ],
      "comprehensionQuestions": [
        {
          "question": "Question in Spanish",
          "options": ["Opt A", "Opt B", "Opt C", "Opt D"],
          "correctAnswer": "Exact correct option string",
          "explanation": "Explanation in Turkish of why this option is correct"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = cleanJsonText(response.text);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.warn('Error generating reading via Gemini, falling back to local generator:', error.message || error);
    try {
      const { level, genre } = req.body;
      const fallbackData = generateReadingFallback(level, genre);
      res.json(fallbackData);
    } catch (fallbackError: any) {
      res.status(500).json({ error: 'Failed to generate reading material' });
    }
  }
});

/* ==========================================
   ENDPOINT 6: EXAM SIMULATOR (DELE / YDS)
   ========================================== */
app.post('/api/exam/generate', async (req, res) => {
  try {
    const { examType, level } = req.body; // examType: 'DELE' or 'YDS', level: e.g. 'B1', 'B2', 'C1'

    const prompt = `You are a professional examiner specializing in DELE (C1/B2/B1) and Turkish YDS Spanish exams.
    Generate a condensed, high-fidelity mock exam simulation for:
    - Exam Type: ${examType || 'YDS'}
    - Target CEFR Level: ${level || 'B2'}

    If YDS: Focus on grammar, translation questions (Spanish to Turkish, Turkish to Spanish), and paragraph reading comprehension. YDS is entirely multiple-choice.
    If DELE: Include a Reading section (Prueba de comprensión de lectura) and a Writing prompt (Prueba de expresión e interacción escritas).

    Create 2 mock sections for this mock exam.
    Section 1 should have 3 questions.
    Section 2 should have either 2 questions or a writing prompt.

    Include the listening/reading passages if required by the section.

    Return the response strictly as a JSON object matching this schema:
    {
      "id": "exam_mock_id",
      "title": "${examType} ${level} Practice Simulation",
      "type": "${examType}",
      "level": "${level}",
      "sections": [
        {
          "id": "sec_1",
          "title": "Section Title (e.g. Comprensión de Lectura or Dilbilgisi ve Kelime Bilgisi)",
          "type": "reading", // or 'grammar' or 'writing'
          "instructions": "Detailed instructions in Turkish",
          "passage": "Optional Spanish passage or reading text if needed",
          "exercises": [
            {
              "id": "q_1",
              "type": "multiple-choice", // or 'writing' or 'fill-blank'
              "question": "Question text in Spanish",
              "options": ["Opt A", "Opt B", "Opt C", "Opt D"], // omit for writing type
              "correctAnswer": "Correct answer string or explanation for writing",
              "hint": "Turkish tip/hint"
            }
          ]
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = cleanJsonText(response.text);
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.warn('Error generating exam simulation via Gemini, falling back to local generator:', error.message || error);
    try {
      const { examType, level } = req.body;
      const fallbackData = generateExamFallback(examType, level);
      res.json(fallbackData);
    } catch (fallbackError: any) {
      res.status(500).json({ error: 'Failed to generate exam' });
    }
  }
});

/* ==========================================
   PCM TO WAV CONVERTER UTILITY
   Ensures browser compatibility for raw audio streams
   ========================================== */
function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);

  // fmt subchunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size
  header.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/* ==========================================
   ENDPOINT 7: TEXT-TO-SPEECH (TTS)
   Generates natural, expressive human-like female Spanish voice
   ========================================== */
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    const cleanText = text.trim();
    // Default to 'Aoede' (warm, natural, expressive female voice), or 'Kore' / 'Leda'
    const validVoices = ['Aoede', 'Kore', 'Leda', 'Callisto', 'Zephyr', 'Despina', 'Fenrir', 'Puck', 'Charon'];
    const voiceName = validVoices.includes(voice) ? voice : 'Aoede';

    let base64Audio: string | undefined;
    let mimeType = 'audio/wav';

    // Attempt generation with Gemini audio models
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });

      const part = response.candidates?.[0]?.content?.parts?.[0];
      base64Audio = part?.inlineData?.data;
      if (part?.inlineData?.mimeType) {
        mimeType = part.inlineData.mimeType;
      }
    } catch (modelErr) {
      // Secondary fallback to gemini-2.0-flash / gemini-3.1-flash-tts-preview
      const altResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
          },
        },
      });
      const altPart = altResponse.candidates?.[0]?.content?.parts?.[0];
      base64Audio = altPart?.inlineData?.data;
      if (altPart?.inlineData?.mimeType) {
        mimeType = altPart.inlineData.mimeType;
      }
    }

    if (!base64Audio) {
      return res.status(500).json({ error: 'No audio generated by the TTS model' });
    }

    // If raw PCM format, package into proper WAV container with 44-byte header
    const rawBuffer = Buffer.from(base64Audio, 'base64');
    const isWav = rawBuffer.length > 4 && rawBuffer.toString('utf-8', 0, 4) === 'RIFF';

    let finalBase64 = base64Audio;
    if (!isWav || mimeType.includes('pcm')) {
      const wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
      finalBase64 = wavBuffer.toString('base64');
      mimeType = 'audio/wav';
    }

    res.json({ audio: finalBase64, mimeType: mimeType });
  } catch (error: any) {
    console.warn('TTS model unavailable, client will use enhanced browser female voice:', error.message || error);
    res.status(503).json({ error: 'TTS temporarily unavailable', useBrowserFallback: true });
  }
});

/* ========================================================
   VITE DEVELOPER SERVER AND PRODUCTION SERVER CONFIGURATION
   ======================================================== */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Spanish Learning Server is running on port ${PORT}`);
  });
}

startServer();
