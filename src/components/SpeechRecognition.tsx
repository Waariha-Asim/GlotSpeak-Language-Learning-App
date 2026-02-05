import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Mic, RotateCcw, Star, Trophy, Volume2, XCircle } from 'lucide-react';
import enhancedWords from '../data/enhancedWords.json';
import { generatePhoneticFeedback, getCommonMistakes } from '../utils/phoneticUtils';
import { useTheme } from '../ThemeContext'; // ✅ Added Theme Hook

const pronunciationExercises = enhancedWords
  .filter(w => w.found && w.phonetic !== 'NOT_FOUND')
  .slice(0, 1000)
  .map((item, idx) => {
    const difficulty = idx < 300 ? 'Easy' : idx < 700 ? 'Medium' : 'Hard';
    const syllableCount = (item.phonetic.match(/\d/g) || []).length;

    return {
      id: idx + 1,
      word: item.word,
      phonetic: item.phonetic,
      syllableCount,
      difficulty,
      tip: getCommonMistakes(item.word) || 'Say it slowly and clearly; focus on each syllable.'
    };
  });

// Calculate similarity between two strings (Levenshtein-based)
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 100;
  const longer = s1.length > s2.length ? s1 : s2;
  if (longer.length === 0) return 100;
  const editDistance = levenshteinDistance(s1, s2);
  const similarity = ((longer.length - editDistance) / longer.length) * 100;
  return Math.round(similarity);
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= str2.length; i++) matrix[i] = [i];
  for (let j = 0; j <= str1.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

export const SpeechRecognition: React.FC = () => {
  const { darkMode } = useTheme(); // ✅ Added Dark Mode state
  const API_URL = import.meta.env.VITE_API_URL;
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
  const [showAllWords, setShowAllWords] = useState(false);
  const [wordSearch, setWordSearch] = useState('');
  const [accent, setAccent] = useState<'en-US' | 'en-GB'>('en-US');
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

  const searchedExercises = useMemo(() => {
    const query = wordSearch.trim().toLowerCase();
    if (!query) return filteredExercises;
    return filteredExercises.filter((w) => w.word.toLowerCase().includes(query));
  }, [filteredExercises, wordSearch]);

  useEffect(() => {
    setCurrentExercise(0);
    setFeedback(null);
    setTranscribedText('');
    setAccuracyScore(null);
    setAttempts(0);
    setShowAllWords(false);
    setWordSearch('');
  }, [difficultyFilter]);

  const exercise = filteredExercises.length
    ? filteredExercises[currentExercise % filteredExercises.length]
    : pronunciationExercises[0];

  const analyzePronounciation = (transcript: string) => {
    const targetWord = exercise.word.toLowerCase();
    const cleanTranscript = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();
    const words = cleanTranscript.split(/\s+/);

    // If the target is a single word, but we heard multiple, pick the one closest to the target
    // This solves the "Apple Apple" (saying it twice) problem.
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
    setTranscribedText(bestTranscriptPart); // Show only the cleaned/best part
    setAttempts((prev: number) => prev + 1);
    const spokenWordEntry = (enhancedWords as any[]).find(w => w.word.toLowerCase() === cleanTranscript);
    const spokenPhonetic = spokenWordEntry ? spokenWordEntry.phonetic : null;

    const phoneticHint = generatePhoneticFeedback(transcript, exercise.word, exercise.phonetic, spokenPhonetic);
    setPronunciationHint(phoneticHint);

    let newFeedback: 'excellent' | 'good' | 'try-again';
    let earnedXP = 0;

    if (similarity >= 90) {
      newFeedback = 'excellent';
      earnedXP = 10;
      setPronunciationHint(null);
      if (!masteredWords.includes(exercise.id)) {
        setMasteredWords((prev: number[]) => [...prev, exercise.id]);
        earnedXP += 5;
      }
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
    }

    setFeedback(newFeedback);
    setIsFinalResultProcessed(true);
    // Force stop recognition immediately after final result to prevent double-catching
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped
      }
    }
    setXpPoints((prev: number) => prev + earnedXP);
    setOverallScore((prev: number) => Math.round((prev * 0.7 + similarity * 0.3)));

    // Save progress to both backend and localStorage
    const updateProgress = async () => {
      try {
        // 1. Update LocalStorage immediately
        const localCount = parseInt(localStorage.getItem('speech_practice_count') || '0');
        localStorage.setItem('speech_practice_count', (localCount + 1).toString());

        // 2. Sync with Backend
        const token = localStorage.getItem('token');
        if (!token) return;

        await fetch(`${API_URL}/api/progress`, {
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

    // Add Grammar List to prioritize the target word
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
    recognition.maxAlternatives = 5; // Increased for better matching

    recognition.onstart = () => {
      setIsReadyToSpeak(true);
      setIsSoundDetected(false);
    };

    recognition.onsoundstart = () => {
      setIsSoundDetected(true);
    };

    recognition.onsoundend = () => {
      setIsSoundDetected(false);
    };

    recognition.onspeechstart = () => {
      setIsSoundDetected(true);
    };

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

          // Improved logic: If the target is a single word, look for it specifically 
          // inside the candidates to handle cases where the user says it twice or adds noise.
          const target = exercise.word.toLowerCase();
          let bestMatch = candidates[0];

          for (const cand of candidates) {
            const words = cand.toLowerCase().split(/\s+/);
            if (words.includes(target)) {
              bestMatch = target; // Found the exact word in a noisy transcript
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

      // Prevent onend logic if we just processed a result in onresult
      const timeSinceLastResult = Date.now() - lastProcessedTimeRef.current;
      if (timeSinceLastResult < 500) return;

      const currentInterim = interimSpeechRef.current.trim();

      if (!isFinalResultProcessed && currentInterim) {
        // Fallback: analyze whatever we heard before the mic closed
        analyzePronounciation(currentInterim);
      } else if (!isFinalResultProcessed && !transcribedText) {
        // Silent failure: Mic closed but nothing heard
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

  const handlePlayAudio = () => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(exercise.word);
    utterance.lang = accent;
    utterance.rate = 0.8;
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    synthRef.current.speak(utterance);
  };

  const nextExercise = () => {
    setFeedback(null);
    setTranscribedText('');
    setAccuracyScore(null);
    setAttempts(0);
    setPronunciationHint(null);
    if (!filteredExercises.length) return;
    setCurrentExercise((prev: number) => (prev + 1) % filteredExercises.length);
  };

  const previousExercise = () => {
    setFeedback(null);
    setTranscribedText('');
    setAccuracyScore(null);
    setAttempts(0);
    setPronunciationHint(null);
    if (!filteredExercises.length) return;
    setCurrentExercise((prev: number) => (prev - 1 + filteredExercises.length) % filteredExercises.length);
  };

  const retryExercise = () => {
    setFeedback(null);
    setTranscribedText('');
    setAccuracyScore(null);
    setPronunciationHint(null);
  };

  return (
    <div className={`p-4 pb-20 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#0f172a]' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Speech Practice</h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Perfect your pronunciation with AI feedback</p>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        {([['en-US', '🇺🇸 American'], ['en-GB', '🇬🇧 British']] as const).map(([code, label]) => (
          <button
            key={code}
            onClick={() => setAccent(code)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${accent === code ? 'bg-blue-600 text-white border-blue-600' : 
              darkMode ? 'bg-[#1e293b] text-gray-400 border-gray-700 hover:border-blue-500' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-2 mb-6">
        {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
          <button
            key={level}
            onClick={() => setDifficultyFilter(level)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${difficultyFilter === level ? 'bg-purple-600 text-white border-purple-600' : 
              darkMode ? 'bg-[#1e293b] text-gray-400 border-gray-700 hover:border-purple-500' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
              }`}
          >
            {level}
          </button>
        ))}
        <div className={`text-xs ml-2 whitespace-nowrap ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{filteredExercises.length} words</div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className={`rounded-xl p-3 shadow-sm text-center border ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-transparent'}`}>
          <Flame className="text-orange-500 mx-auto mb-1" size={24} />
          <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{streak}</div>
          <div className="text-xs text-gray-500">Streak</div>
        </div>
        <div className={`rounded-xl p-3 shadow-sm text-center border ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-transparent'}`}>
          <Star className="text-yellow-500 mx-auto mb-1" size={24} />
          <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{xpPoints}</div>
          <div className="text-xs text-gray-500">XP</div>
        </div>
        <div className={`rounded-xl p-3 shadow-sm text-center border ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-transparent'}`}>
          <Trophy className="text-purple-500 mx-auto mb-1" size={24} />
          <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{masteredWords.length}</div>
          <div className="text-xs text-gray-500">Mastered</div>
        </div>
      </div>

      <div className={`rounded-2xl p-4 mb-6 shadow-sm border ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>Overall Accuracy</h3>
          <div className="text-2xl font-bold text-green-600">{overallScore}%</div>
        </div>
        <div className={`w-full rounded-full h-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <div
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${overallScore}%` }}
          ></div>
        </div>
      </div>

      <div className={`rounded-3xl shadow-lg border mb-6 overflow-hidden ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className={`p-6 border-b text-center ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${exercise.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
              exercise.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
              {exercise.difficulty}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{currentExercise + 1} / {filteredExercises.length}</span>
          </div>
          <h2 className={`text-5xl font-black mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>{exercise.word}</h2>
          <p className={`font-mono text-xl ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{exercise.phonetic}</p>
        </div>

        <div className="p-8">
          <button
            onClick={handlePlayAudio}
            disabled={isPlaying}
            className={`flex items-center justify-center w-full rounded-2xl p-4 mb-8 transition-all active:scale-[0.98] disabled:opacity-50 ${darkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' : 'bg-blue-50 hover:bg-blue-100'}`}
          >
            <Volume2 size={24} className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-3 ${isPlaying ? 'animate-pulse' : ''}`} />
            <span className={`font-bold text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{isPlaying ? 'Playing...' : 'Hear it spoken'}</span>
          </button>

          <div className="text-center">
            <div className="relative mb-6 mx-auto w-24 h-24">
              <div className={`absolute inset-0 ${darkMode ? 'bg-indigo-500/10' : 'bg-indigo-500/20'} rounded-full transition-all duration-300 ${isSoundDetected ? 'animate-ping scale-150 opacity-100' : 'scale-0 opacity-0'}`}></div>
              <button
                onClick={handleRecord}
                disabled={!browserSupported}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-90 ${isRecording
                  ? 'bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100'
                  } disabled:opacity-50`}
              >
                <Mic className="text-white" size={40} />
              </button>
            </div>

            <div className="h-6 mb-8">
              <p className={`text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${isRecording ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                {isRecording ? (isReadyToSpeak ? '🎤 Speak Now' : 'Initialising...') : 'Tap to Practice'}
              </p>
            </div>

            {transcribedText && (
              <div className={`rounded-2xl p-5 mb-6 border ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>You pronounced</p>
                <p className={`text-2xl font-bold mb-2 italic ${darkMode ? 'text-white' : 'text-gray-800'}`}>"{transcribedText}"</p>
                {accuracyScore !== null && (
                  <div className={`mt-3 inline-block px-4 py-1 rounded-full border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <span className={`text-xs font-bold mr-2 uppercase ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Accuracy</span>
                    <span className={`font-black text-lg ${accuracyScore >= 90 ? 'text-green-500' : accuracyScore >= 75 ? 'text-blue-500' : 'text-red-500'}`}>
                      {accuracyScore}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {pronunciationHint && (
              <div className={`rounded-2xl p-5 mb-6 text-left border shadow-sm ${darkMode ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-600'}`}>🎯</div>
                  <div>
                    <p className={`font-bold text-sm mb-1 uppercase tracking-tight ${darkMode ? 'text-amber-300' : 'text-amber-900'}`}>Pronunciation Tip</p>
                    <p className={`text-sm leading-relaxed ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{pronunciationHint}</p>
                  </div>
                </div>
              </div>
            )}

            {feedback && (
              <div className={`inline-flex items-center px-6 py-3 rounded-2xl mb-8 font-bold text-sm shadow-sm transition-all animate-in fade-in zoom-in duration-300 ${feedback === 'excellent' ? 
                (darkMode ? 'bg-green-900/30 text-green-300 border border-green-800/50' : 'bg-green-100 text-green-700 border border-green-200') :
                feedback === 'good' ? 
                (darkMode ? 'bg-blue-900/30 text-blue-300 border border-blue-800/50' : 'bg-blue-100 text-blue-700 border border-blue-200') : 
                (darkMode ? 'bg-red-900/30 text-red-300 border border-red-800/50' : 'bg-red-100 text-red-700 border border-red-200')
                }`}>
                {feedback === 'excellent' ? '🎉 Brilliant!' : feedback === 'good' ? '👍 Great Effort!' : '💪 Keep Trying!'}
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={retryExercise}
                className={`flex-1 min-w-[100px] px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm active:translate-y-0.5 ${darkMode ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-indigo-700 hover:text-indigo-400' : 'bg-white border border-gray-200 hover:border-indigo-200 text-gray-600 hover:text-indigo-600'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  <RotateCcw size={16} />
                  <span>Reset</span>
                </div>
              </button>

              <button
                onClick={previousExercise}
                className={`flex-1 min-w-[100px] px-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm active:translate-y-0.5 ${darkMode ? 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-indigo-700 hover:text-indigo-400' : 'bg-white border border-gray-200 hover:border-indigo-200 text-gray-600 hover:text-indigo-600'}`}
              >
                Prev
              </button>

              {feedback === 'try-again' && (
                <button
                  onClick={handleRecord}
                  className="flex-1 min-w-[120px] px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-red-100 active:translate-y-0.5"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RotateCcw size={16} />
                    <span>Try Again</span>
                  </div>
                </button>
              )}

              {((feedback === 'try-again' && attempts >= 1 && attempts < 3) || feedback === 'excellent' || feedback === 'good') && (
                <button
                  onClick={nextExercise}
                  className="flex-1 min-w-[120px] px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 active:translate-y-0.5"
                >
                  Next Word
                </button>
              )}

              {attempts >= 3 && feedback === 'try-again' && (
                <button
                  onClick={nextExercise}
                  className="flex-1 min-w-[100px] px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-orange-100 active:translate-y-0.5"
                >
                  Skip Word
                </button>
              )}
            </div>

            {attempts > 0 && (
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-6 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                Attempt: <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{attempts}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`rounded-3xl p-6 border shadow-sm ${darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-100'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>💡</div>
          <h3 className={`font-bold ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>Learn the Technique</h3>
        </div>
        <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{exercise.tip}</p>
      </div>

      {showAllWords && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className={`rounded-[32px] shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden ${darkMode ? 'bg-[#1e293b] border border-gray-700' : 'bg-white border border-gray-100'}`}>
            <div className={`flex items-center justify-between px-8 py-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
              <div>
                <h4 className={`text-xl font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>{difficultyFilter} Library</h4>
                <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{searchedExercises.length} words available</p>
              </div>
              <button
                onClick={() => setShowAllWords(false)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className={`px-8 py-4 ${darkMode ? 'bg-gray-900/50' : 'bg-gray-50/50'}`}>
              <input
                type="text"
                value={wordSearch}
                onChange={(e) => setWordSearch(e.target.value)}
                placeholder="Search words..."
                className={`w-full rounded-2xl shadow-sm px-5 py-3 text-sm font-medium focus:ring-2 transition-all ${darkMode ? 'bg-gray-800 border-none text-white focus:ring-indigo-500/20' : 'bg-white border-none focus:ring-indigo-500/20'}`}
              />
            </div>

            <div className="p-8 overflow-y-auto grid grid-cols-2 md:grid-cols-4 gap-3">
              {searchedExercises.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Results Found</p>
                </div>
              ) : (
                searchedExercises.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentExercise(pronunciationExercises.indexOf(item));
                      setShowAllWords(false);
                    }}
                    className={`px-4 py-3 rounded-2xl border text-xs font-bold text-center transition-all active:scale-95 ${darkMode 
                      ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-700 hover:bg-indigo-900/30 hover:text-indigo-400' 
                      : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 text-gray-600 hover:text-indigo-600'}`}
                  >
                    {item.word}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};