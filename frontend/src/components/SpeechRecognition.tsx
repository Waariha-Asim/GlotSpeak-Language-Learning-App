import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Flame,
  Mic,
  RotateCcw,
  Star,
  Trophy,
  Volume2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import enhancedWords from '../data/enhancedWords.json';
import { generatePhoneticFeedback, getCommonMistakes } from '../utils/phoneticUtils';
import { useTheme } from '../ThemeContext';

// ────────────────────────────────────────────────
// IPA Mapping
// ────────────────────────────────────────────────
const convertToIPA = (arpabet: string): string => {
  const mapping: { [key: string]: string } = {
    'DH': 'ð', 'AE1': 'æ', 'AE0': 'æ', 'AE2': 'æ', 'W': 'w', 'IH1': 'ɪ', 'IH0': 'ɪ', 'IH2': 'ɪ',
    'HH': 'h', 'V': 'v', 'TH': 'θ', 'IY1': 'i', 'IY0': 'i', 'AA1': 'ɑ', 'AA0': 'ɑ', 'AH1': 'ʌ',
    'AH0': 'ə', 'ER1': 'ɜr', 'ER0': 'ər', 'EY1': 'eɪ', 'AY1': 'aɪ', 'OW1': 'oʊ', 'UW1': 'u',
    'AO1': 'ɔ', 'EH1': 'ɛ', 'Z': 'z', 'S': 's', 'T': 't', 'D': 'd', 'N': 'n', 'L': 'l', 'R': 'r',
    'M': 'm', 'P': 'p', 'B': 'b', 'F': 'f', 'K': 'k', 'G': 'ɡ', 'SH': 'ʃ', 'ZH': 'ʒ', 'CH': 'tʃ',
    'JH': 'dʒ', 'Y': 'j', 'NG': 'ŋ'
  };
  return arpabet.split(' ').map(phoneme => mapping[phoneme] || phoneme.toLowerCase()).join('');
};

const pronunciationExercises = enhancedWords
  .filter(w => w.found && w.phonetic !== 'NOT_FOUND')
  .slice(0, 1000)
  .map((item, idx) => {
    const difficulty = idx < 300 ? 'Easy' : idx < 700 ? 'Medium' : 'Hard';
    const syllableCount = (item.phonetic.match(/\d/g) || []).length;
    return {
      id: idx + 1,
      word: item.word,
      phonetic: convertToIPA(item.phonetic),
      syllableCount,
      difficulty,
      tip: getCommonMistakes(item.word) || 'Say it slowly and focus on clarity.'
    };
  });

// ────────────────────────────────────────────────
// Similarity calculation
// ────────────────────────────────────────────────
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 100;
  const longer = s1.length > s2.length ? s1 : s2;
  const editDistance = (a: string, b: string) => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[b.length][a.length];
  };
  return Math.round(((longer.length - editDistance(s1, s2)) / longer.length) * 100);
};

const getPPA = (word: string) => word.toLowerCase().replace(/tion/g, 'shun').replace(/ph/g, 'f').toUpperCase();

export const SpeechRecognition: React.FC = () => {
  const { darkMode } = useTheme();

  const [currentExercise, setCurrentExercise] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<'excellent' | 'good' | 'try-again' | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [overallScore, setOverallScore] = useState(0);
  const [xpPoints, setXpPoints] = useState(0);
  const [streak] = useState(3);
  const [attempts, setAttempts] = useState(0);
  const [masteredWords, setMasteredWords] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>('en-US');
  const [phoneticType, setPhoneticType] = useState<'IPA' | 'PPA'>('IPA');
  const [pronunciationHint, setPronunciationHint] = useState<string | null>(null);
  const [isReadyToSpeak, setIsReadyToSpeak] = useState(false);
  const [isFinalResultProcessed, setIsFinalResultProcessed] = useState(false);
  const [isSoundDetected, setIsSoundDetected] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const interimSpeechRef = useRef<string>('');
  const lastProcessedTimeRef = useRef<number>(0);

  const filteredExercises = useMemo(
    () => pronunciationExercises.filter((w) => w.difficulty === difficultyFilter),
    [difficultyFilter]
  );

  const exercise = filteredExercises.length
    ? filteredExercises[currentExercise % filteredExercises.length]
    : pronunciationExercises[0];

  // Load last unsuccessful index for current difficulty
  useEffect(() => {
    const key = `last_unsuccessful_${difficultyFilter}`;
    const saved = localStorage.getItem(key);
    let idx = 0;
    if (saved) {
      idx = parseInt(saved, 10);
      if (isNaN(idx) || idx >= filteredExercises.length) idx = 0;
    }
    setCurrentExercise(idx);
    setAttempts(0);
    setFeedback(null);
    setTranscribedText('');
    setAccuracyScore(null);
    setPronunciationHint(null);
  }, [difficultyFilter, filteredExercises.length]);

  const analyzePronounciation = (transcript: string) => {
    const targetWord = exercise.word.toLowerCase();
    const cleanTranscript = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const words = cleanTranscript.split(/\s+/);

    let bestTranscriptPart = cleanTranscript;
    if (words.length > 1 && !exercise.word.includes(' ')) {
      let maxSimilarity = -1;
      for (const word of words) {
        const sim = calculateSimilarity(word, targetWord);
        if (sim > maxSimilarity) {
          maxSimilarity = sim;
          bestTranscriptPart = word;
        }
      }
    }

    const similarity = calculateSimilarity(bestTranscriptPart, exercise.word);
    const attemptNumber = attempts + 1;
    setAccuracyScore(similarity);
    setTranscribedText(bestTranscriptPart);
    setAttempts(prev => prev + 1);

    const spokenWordEntry = (enhancedWords as any[]).find(w => w.word.toLowerCase() === cleanTranscript);
    const spokenPhonetic = spokenWordEntry ? spokenWordEntry.phonetic : null;

    const phoneticHint = generatePhoneticFeedback(transcript, exercise.word, exercise.phonetic, spokenPhonetic);
    setPronunciationHint(phoneticHint);

    let newFeedback: 'excellent' | 'good' | 'try-again';
    let earnedXP = 0;

    const key = `last_unsuccessful_${difficultyFilter}`;

    if (similarity >= 90) {
      newFeedback = 'excellent';
      earnedXP = 10;
      setPronunciationHint(null);
      if (!masteredWords.includes(exercise.id)) {
        setMasteredWords(prev => [...prev, exercise.id]);
        earnedXP += 5;
      }
      localStorage.removeItem(key);
    } else if (similarity >= 75) {
      newFeedback = 'good';
      earnedXP = 5;
    } else {
      newFeedback = 'try-again';
      earnedXP = Math.max(1, 4 - attemptNumber);
      if (attemptNumber === 1) {
        setPronunciationHint(`${phoneticHint} Give it another shot!`);
      } else if (attemptNumber === 2) {
        setPronunciationHint(`${phoneticHint} Give it another try!`);
      } else if (attemptNumber === 3) {
        setPronunciationHint(`Don't give up! ${phoneticHint} One more try?`);
      } else {
        setPronunciationHint(`${phoneticHint} You can keep practicing or skip this word.`);
      }
      localStorage.setItem(key, currentExercise.toString());
    }

    setFeedback(newFeedback);
    setIsFinalResultProcessed(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    setXpPoints(prev => prev + earnedXP);
    setOverallScore(prev => Math.round(prev * 0.7 + similarity * 0.3));

    // Progress update to backend + local count
    const updateProgress = async () => {
      try {
        const localCount = parseInt(localStorage.getItem('speech_practice_count') || '0');
        localStorage.setItem('speech_practice_count', (localCount + 1).toString());

        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch('http://localhost:5000/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            module: "speechRecognition",
            score: similarity,
            total: 100
          })
        });
      } catch (error) {
        console.error('Error updating speech progress:', error);
      }
    };

    updateProgress();
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setBrowserSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();

    const SpeechGrammarList = (window as any).SpeechGrammarList || (window as any).webkitSpeechGrammarList;
    if (SpeechGrammarList) {
      const grammar = `#JSGF V1.0; grammar word; public <word> = ${exercise.word};`;
      const speechRecognitionList = new SpeechGrammarList();
      speechRecognitionList.addFromString(grammar, 1);
      recognition.grammars = speechRecognitionList;
    }

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = accent;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsReadyToSpeak(true);
      setIsSoundDetected(false);
    };

    recognition.onsoundstart = () => setIsSoundDetected(true);
    recognition.onsoundend = () => setIsSoundDetected(false);
    recognition.onspeechstart = () => setIsSoundDetected(true);

    recognition.onnomatch = () => {
      setPronunciationHint("We heard you speaking, but couldn't quite identify the word. Try enunciating a bit more clearly!");
      setFeedback('try-again');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          const candidates = Array.from(result).map((alt: any) => alt.transcript.trim());
          const target = exercise.word.toLowerCase();
          let bestMatch = candidates[0];

          for (const cand of candidates) {
            const words = cand.toLowerCase().split(/\s+/);
            if (words.includes(target)) {
              bestMatch = target;
              break;
            }
          }

          finalTranscript = bestMatch;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        lastProcessedTimeRef.current = Date.now();
        setTranscribedText(finalTranscript);
        interimSpeechRef.current = finalTranscript;
        analyzePronounciation(finalTranscript);
        setIsFinalResultProcessed(true);
      } else if (interimTranscript) {
        setTranscribedText(interimTranscript);
        interimSpeechRef.current = interimTranscript;
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsReadyToSpeak(false);

      if (event.error === 'no-speech') {
        setPronunciationHint("We couldn't hear anything. Try speaking a bit louder and closer to the microphone.");
        setFeedback('try-again');
      } else if (event.error === 'not-allowed') {
        setPermissionDenied(true);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setIsReadyToSpeak(false);

      const timeSinceLastResult = Date.now() - lastProcessedTimeRef.current;
      if (timeSinceLastResult < 500) return;

      const currentInterim = interimSpeechRef.current.trim();

      if (!isFinalResultProcessed && currentInterim) {
        analyzePronounciation(currentInterim);
      } else if (!isFinalResultProcessed && !transcribedText) {
        setPronunciationHint("We didn't hear anything clearly. Try speaking a bit louder when you see 'Speak Now'!");
        setFeedback('try-again');
      }
      setIsSoundDetected(false);
    };

    recognitionRef.current = recognition;
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [accent, exercise.word]);

  const handleRecord = () => {
    if (!browserSupported || permissionDenied) return;

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setTranscribedText('');
      interimSpeechRef.current = '';
      setIsFinalResultProcessed(false);
      setAccuracyScore(null);
      setFeedback(null);
      setPronunciationHint(null);
      setIsRecording(true);
      try {
        recognitionRef.current?.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
        setIsRecording(false);
      }
    }
  };

  const nextExercise = () => {
    const key = `last_unsuccessful_${difficultyFilter}`;
    localStorage.removeItem(key);
    setCurrentExercise((prev) => (prev + 1) % filteredExercises.length);
    setFeedback(null);
    setTranscribedText('');
    setAccuracyScore(null);
    setAttempts(0);
    setPronunciationHint(null);
  };

  const previousExercise = () => {
    const key = `last_unsuccessful_${difficultyFilter}`;
    localStorage.removeItem(key);
    setCurrentExercise((prev) => (prev - 1 + filteredExercises.length) % filteredExercises.length);
    setFeedback(null);
    setTranscribedText('');
    setAccuracyScore(null);
    setAttempts(0);
    setPronunciationHint(null);
  };

  return (
    <div className={`p-4 pb-20 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a]' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>

      {/* HEADER */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Speech Practice</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600 text-sm'}>Perfect your pronunciation</p>
        </div>
        <div className="flex bg-gray-200/50 p-1 rounded-xl backdrop-blur-sm">
          <button onClick={() => setPhoneticType('IPA')} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${phoneticType === 'IPA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>IPA</button>
          <button onClick={() => setPhoneticType('PPA')} className={`px-3 py-1 rounded-lg text-[10px] font-bold ${phoneticType === 'PPA' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>PPA</button>
        </div>
      </div>

      {/* ACCENT SELECTOR */}
      <div className="flex space-x-2 mb-4">
        {([['en-US', '🇺🇸 American'], ['en-GB', '🇬🇧 British']] as const).map(([code, label]) => (
          <button key={code} onClick={() => setAccent(code)} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${accent === code ? 'bg-blue-600 text-white border-blue-600' : darkMode ? 'bg-[#1e293b] text-gray-400 border-gray-700' : 'bg-white text-gray-600 border-gray-200'}`}>{label}</button>
        ))}
      </div>

      {/* DIFFICULTY TABS */}
      <div className="flex space-x-2 mb-6">
        {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
          <button key={level} onClick={() => setDifficultyFilter(level)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${difficultyFilter === level ? 'bg-purple-600 text-white border-purple-600' : darkMode ? 'bg-[#1e293b] text-gray-400 border-gray-700' : 'bg-white text-gray-600 border-gray-200'}`}>{level}</button>
        ))}
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`rounded-2xl p-3 border text-center ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <Flame className="text-orange-500 mx-auto mb-1" size={20} />
          <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{streak}</div>
          <div className="text-[8px] uppercase text-gray-500 font-bold">Streak</div>
        </div>
        <div className={`rounded-2xl p-3 border text-center ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <Star className="text-yellow-500 mx-auto mb-1" size={20} />
          <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{xpPoints}</div>
          <div className="text-[8px] uppercase text-gray-500 font-bold">XP</div>
        </div>
        <div className={`rounded-2xl p-3 border text-center ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
          <Trophy className="text-purple-500 mx-auto mb-1" size={20} />
          <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{masteredWords.length}</div>
          <div className="text-[8px] uppercase text-gray-500 font-bold">Mastered</div>
        </div>
      </div>

      {/* MAIN WORD CARD */}
      <div className={`rounded-[2.5rem] shadow-xl border mb-6 overflow-hidden relative ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-50'}`}>
        {feedback === 'try-again' && (
          <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center animate-in fade-in zoom-in">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="text-red-500" size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Try Again</h3>
            <button onClick={() => setFeedback(null)} className="px-10 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg">Got it</button>
          </div>
        )}

        <div className={`p-8 border-b text-center ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
              exercise.difficulty === 'Easy' ? 'bg-green-100 text-green-600' :
              exercise.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
              'bg-red-100 text-red-600'
            }`}>
              {exercise.difficulty}
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              {(currentExercise % filteredExercises.length) + 1} / {filteredExercises.length}
            </span>
          </div>
          <h2 className={`text-5xl font-black mb-2 tracking-tighter ${darkMode ? 'text-white' : 'text-gray-800'}`}>{exercise.word}</h2>
          <p className="text-2xl font-serif italic text-indigo-500">
            {phoneticType === 'IPA' ? `/${exercise.phonetic}/` : getPPA(exercise.word)}
          </p>
        </div>

        <div className="p-8">
          <button
            onClick={() => {
              synthRef.current?.cancel();
              const u = new SpeechSynthesisUtterance(exercise.word);
              u.lang = accent;
              synthRef.current?.speak(u);
            }}
            className={`flex items-center justify-center w-full rounded-2xl p-4 mb-8 font-bold ${darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}
          >
            <Volume2 size={24} className="mr-3" /> Hear Native Sound
          </button>

          <div className="text-center relative">
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 rounded-full transition-all duration-500 ${isSoundDetected ? 'scale-125 animate-pulse' : 'scale-0'}`}></div>
            
            <button
              onClick={handleRecord}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-2xl ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`}
            >
              <Mic className="text-white" size={40} />
            </button>

            {/* "Speak Now" text added below Mic symbol */}
            <p className={`text-sm font-bold uppercase tracking-widest mt-4 transition-colors ${isRecording ? 'text-red-600 animate-pulse' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isRecording ? 'Speak Now' : 'Tap to Practice'}
            </p>

            {transcribedText && (
              <div className="mt-8 p-5 rounded-3xl bg-gray-50 border border-gray-100">
                <p className="text-xl font-bold text-gray-800 italic">"{transcribedText}"</p>
                {accuracyScore !== null && (
                  <div className={`text-3xl font-black mt-2 ${accuracyScore >= 85 ? 'text-green-500' : 'text-orange-500'}`}>
                    {accuracyScore}% Accuracy
                  </div>
                )}
              </div>
            )}

            {pronunciationHint && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
                {pronunciationHint}
              </div>
            )}

            <div className="flex gap-4 mt-10">
              <button
                onClick={previousExercise}
                className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-400 bg-white"
              >
                <ChevronLeft className="inline mr-1" size={18} /> Prev
              </button>
              <button
                onClick={nextExercise}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100"
              >
                Next Word <ChevronRight className="inline ml-1" size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TECHNIQUE TIP */}
      <div className={`p-6 rounded-[2rem] border ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <AlertCircle size={18} className="text-indigo-500" /> Learn Technique
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">{exercise.tip}</p>
      </div>
    </div>
  );
};