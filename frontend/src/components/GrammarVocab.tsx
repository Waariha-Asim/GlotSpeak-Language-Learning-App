import React, { useState, useEffect } from "react";
import axios from "axios";
import { Book, Brain, Target, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../ThemeContext";
import { useUser } from "../UserContext"; // ✅ Level access karne ke liye
const API_URL = import.meta.env.VITE_API_URL;

const topics = [
  { id: "grammar", name: "Grammar", icon: Book, color: "bg-blue-600" },
  { id: "vocabulary", name: "Vocabulary", icon: Brain, color: "bg-green-600" },
];

export const GrammarVocab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"grammar" | "vocabulary">("grammar");
  const [grammarExercises, setGrammarExercises] = useState<any[]>([]);
  const [vocabularyWords, setVocabularyWords] = useState<any[]>([]);
  const [loadingGrammar, setLoadingGrammar] = useState(true);
  const [loadingVocab, setLoadingVocab] = useState(true);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { darkMode } = useTheme();
  const { level } = useUser(); // ✅ User Context se level liya

  const normalizedLevel = (level || 'beginner').toLowerCase();
  const levelLabel = (level || 'Beginner');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    axios.get(`${API_URL}/api/grammar`)
      .then((res) => {
        const allGrammar = res.data;

        // Current level logic
        const normalizedLevel = (level || 'beginner').toLowerCase();

        let filteredGrammar: any[] = [];

        // Check if all exercises have 'level' field
        const hasLevelField = allGrammar.every((g: any) => g.level !== undefined);
        if (hasLevelField) {
          filteredGrammar = allGrammar.filter(
            (exercise: any) => exercise.level.toLowerCase() === normalizedLevel
          );
        } else {
          // Range-based fallback when level metadata is absent
          if (normalizedLevel === 'beginner') {
            filteredGrammar = allGrammar.slice(0, 300);
          } else if (normalizedLevel === 'intermediate') {
            filteredGrammar = allGrammar.slice(300, 600);
          } else if (normalizedLevel === 'advanced') {
            filteredGrammar = allGrammar.slice(600, 997);
          } else {
            filteredGrammar = allGrammar;
          }
        }

        // Set state for frontend
        setGrammarExercises(filteredGrammar);
        setCurrentExercise(0);
        setSelectedAnswer(null);
        setShowResult(false);
      })
      .catch((err) => console.error("❌ Grammar fetch error:", err))
      .finally(() => setLoadingGrammar(false));

    // 2. Vocab Fetch (Filtered by Level)
    axios.get(`${API_URL}/api/vocab`)
      .then((res) => {
        const allVocab = res.data;
        let filteredVocab = [];

        // Auto categorize vocabulary words based on index (aligned with grammar ranges)
        if (normalizedLevel === 'beginner') {
          filteredVocab = allVocab.slice(0, 300);
        } else if (normalizedLevel === 'intermediate') {
          filteredVocab = allVocab.slice(300, 600);
        } else if (normalizedLevel === 'advanced') {
          filteredVocab = allVocab.slice(600, 997);
        } else {
          filteredVocab = allVocab.slice(0, 300);
        }

        // If database has difficulty field, use that instead
        if (allVocab[0]?.difficulty) {
          filteredVocab = allVocab.filter((v: any) =>
            v.difficulty?.toLowerCase() === normalizedLevel
          );
        }

        setVocabularyWords(filteredVocab);
        setCurrentWord(0); // Level badalne par pehle word par reset
      })
      .catch((err) => console.error("Vocab fetch error:", err))
      .finally(() => setLoadingVocab(false));
  }, [level]); // Level change hone par vocab refresh hoga

  // --- Navigation Logic ---
  const nextExercise = () => {
    if (grammarExercises.length === 0) return;
    setCurrentExercise((prev) => (prev + 1) % grammarExercises.length);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const previousExercise = () => {
    if (grammarExercises.length === 0) return;
    setCurrentExercise((prev) => (prev - 1 + grammarExercises.length) % grammarExercises.length);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const nextWord = () => {
    if (vocabularyWords.length === 0) return;
    setCurrentWord((prev) => (prev + 1) % vocabularyWords.length);
    setShowDefinition(false);
  };

  const previousWord = () => {
    if (vocabularyWords.length === 0) return;
    setCurrentWord((prev) => (prev - 1 + vocabularyWords.length) % vocabularyWords.length);
    setShowDefinition(false);
  };

  if (!currentUser) {
    return (
      <div className={`p-4 pb-20 min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-[#F8F9FE]'}`}>
        <div className="text-center">
          <Book size={64} className="text-gray-300 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Please log in to practice</h2>
          <button onClick={() => window.location.href = '/login'} className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">Login Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 pb-20 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-[#F8F9FE]'}`}>

      {/* Header Section */}
      <div className="flex justify-between items-start mb-6 pt-4">
        <div>
          <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-[#2D3142]'}`}>Grammar & Vocabulary</h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>Strengthen your language foundation</p>
        </div>
        <div className={`${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'} px-3 py-1.5 rounded-full border`}>
          <span className={`text-[10px] font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} uppercase tracking-wider`}>{levelLabel.charAt(0).toUpperCase() + levelLabel.slice(1)} Level</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'} flex rounded-2xl p-1.5 mb-8`}>
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => setActiveTab(topic.id as "grammar" | "vocabulary")}
            className={`flex-1 flex items-center justify-center py-3.5 rounded-xl font-bold transition-all ${activeTab === topic.id ? `${topic.color} text-white shadow-lg` : `${darkMode ? 'text-gray-400' : 'text-gray-500 hover:bg-gray-50'}`
              }`}
          >
            <topic.icon size={18} className="mr-2" /> {topic.name}
          </button>
        ))}
      </div>

      {/* Grammar Section (Filtered by Level) */}
      {activeTab === "grammar" && (
        <div className="animate-in fade-in duration-300">
          {loadingGrammar ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>
          ) : grammarExercises.length === 0 ? (
            <div className={`text-center py-20 ${darkMode ? 'bg-gray-800/10' : 'bg-gray-800/10'} rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <p className="text-gray-500 font-medium">No {level} grammar questions available yet.</p>
              <p className="text-gray-400 text-sm mt-2">Try changing your level in settings</p>
            </div>
          ) : (
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-transparent'} rounded-[24px] shadow-xl overflow-hidden border`}>
              <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className={`${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'} px-4 py-1.5 rounded-full text-xs font-black`}>
                    Question {currentExercise + 1} of {grammarExercises.length}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${normalizedLevel === 'beginner'
                    ? `${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`
                    : normalizedLevel === 'intermediate'
                      ? `${darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`
                      : `${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`
                    }`}>
                    {levelLabel.charAt(0).toUpperCase() + levelLabel.slice(1)}
                  </span>
                </div>
                <Target size={20} className="text-blue-400 opacity-50" />
              </div>
              <div className="p-6">
                <h3 className={`text-xl font-bold mb-8 leading-snug ${darkMode ? 'text-white' : 'text-[#2D3142]'}`}>
                  {grammarExercises[currentExercise]?.question}
                </h3>
                <div className="space-y-3">
                  {grammarExercises[currentExercise]?.options.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (!showResult) {
                          setSelectedAnswer(index);
                          setShowResult(true);
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border-2 font-bold transition-all flex items-center ${showResult
                      ? index === grammarExercises[currentExercise].correct
                        ? `${darkMode ? 'bg-green-900/20 border-green-700 text-green-300' : 'bg-green-50 border-green-500 text-green-700'}`
                        : selectedAnswer === index
                          ? `${darkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-500 text-red-700'}`
                          : "opacity-40 border-transparent"
                      : `${darkMode ? 'border-[#2D3748] bg-gray-900/50 hover:border-blue-400' : 'border-[#F1F3F9] bg-[#F8FAFC] hover:border-blue-400'}`
                      }`}>
                      <span className={`w-8 h-8 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm flex items-center justify-center mr-4 text-sm`}>{String.fromCharCode(65 + index)}</span>
                      {option}
                    </button>
                  ))}
                </div>
                {showResult && (
                  <div className={`mt-6 p-4 rounded-xl text-sm ${darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-800'}`}>
                    <strong>Explanation:</strong> {grammarExercises[currentExercise]?.explanation}
                  </div>
                )}
                <div className="flex flex-col space-y-3 mt-8">
                  <div className="flex space-x-3">
                    <button onClick={previousExercise} disabled={currentExercise === 0} className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'} flex items-center justify-center`}>
                      <ChevronLeft size={16} className="mr-1" /> Back
                    </button>
                    <button onClick={() => { setShowResult(false); setSelectedAnswer(null); }} className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'} flex items-center justify-center`}>
                      <RotateCcw size={16} className="mr-1" /> Reset
                    </button>
                  </div>
                  {showResult && <button onClick={nextExercise} className={`w-full ${darkMode ? 'bg-blue-600' : 'bg-gray-900'} text-white py-4 rounded-2xl font-black`}>Next Question</button>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vocabulary Section (Filtered by Level) */}
      {activeTab === "vocabulary" && (
        <div className="animate-in slide-in-from-right-4 duration-300">
          {loadingVocab ? (
            <div className="text-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div></div>
          ) : vocabularyWords.length === 0 ? (
            <div className={`text-center py-20 ${darkMode ? 'bg-gray-800/10' : 'bg-gray-800/10'} rounded-2xl border-2 border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
              <p className="text-gray-500 font-medium">No {level} words available yet.</p>
              <p className="text-gray-400 text-sm mt-2">Try changing your level in settings</p>
            </div>
          ) : (
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-[32px] p-8 shadow-2xl text-center border ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400 text-xs font-black uppercase tracking-[2px]">Vocabulary Builder</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${normalizedLevel === 'beginner'
                    ? `${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`
                    : normalizedLevel === 'intermediate'
                      ? `${darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-700'}`
                      : `${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`
                    }`}>
                    {levelLabel.charAt(0).toUpperCase() + levelLabel.slice(1)}
                  </span>
                </div>
                <h2 className={`text-5xl font-black mt-4 mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-[#2D3142]'}`}>
                  {vocabularyWords[currentWord]?.word}
                </h2>
                <div className="h-1 w-12 bg-green-500 mx-auto rounded-full"></div>
              </div>

              {showDefinition && (
                <div className="space-y-4 mb-10 text-left">
                  <div className={`${darkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50/50 border-green-100'} p-5 rounded-2xl border`}>
                    <h4 className={`${darkMode ? 'text-green-400' : 'text-green-600'} text-[10px] font-black uppercase mb-1`}>Meaning</h4>
                    <p className={`${darkMode ? 'text-green-400' : 'text-green-800'} font-bold leading-relaxed`}>{vocabularyWords[currentWord]?.definition}</p>
                  </div>
                  <div className={`${darkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50/50 border-indigo-100'} p-5 rounded-2xl border`}>
                    <h4 className={`${darkMode ? 'text-indigo-400' : 'text-indigo-600'} text-[10px] font-black uppercase mb-1`}>Example</h4>
                    <p className={`${darkMode ? 'text-indigo-400' : 'text-indigo-800'} italic font-medium leading-relaxed`}>"{vocabularyWords[currentWord]?.example}"</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button onClick={() => setShowDefinition(!showDefinition)} className={`w-full py-4 rounded-2xl font-black transition-all ${showDefinition
                  ? `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`
                  : 'bg-green-600 text-white shadow-xl shadow-green-200'
                  }`}>
                  {showDefinition ? "Hide Meaning" : "Check Meaning"}
                </button>
                <div className="flex space-x-3">
                  <button onClick={previousWord} disabled={currentWord === 0} className={`flex-1 py-3 rounded-xl font-medium ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'}`}>
                    <ChevronLeft size={16} className="mr-1 inline" /> Back
                  </button>
                  <button onClick={nextWord} className={`flex-1 py-3 rounded-xl font-black ${darkMode ? 'bg-blue-600' : 'bg-gray-900'} text-white`}>
                    Next Word <ChevronRight size={16} className="ml-1 inline" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
