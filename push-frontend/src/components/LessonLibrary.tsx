import React, { useEffect, useState } from "react";
import { Clock, Star, Search, Play, X, RotateCcw } from "lucide-react";
import { getLessons, updateLesson } from "../services/lessonService";
import { useTheme } from "../ThemeContext";
import { useUser } from "../UserContext";

export const LessonLibrary: React.FC = () => {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);

  const { darkMode } = useTheme();
  const { level } = useUser();

  useEffect(() => {
    getLessons()
      .then((res) => setLessons(res))
      .catch(() => setError("Failed to fetch lessons"))
      .finally(() => setLoading(false));
  }, []);

  const formatTitle = (title: string) => {
    return title.includes(":") ? title.split(":")[1].trim() : title;
  };

  const dynamicTopics = ["All", ...Array.from(new Set(lessons.map(l => l.topic).filter(Boolean)))];

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lesson.topic && lesson.topic.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTopic =
      selectedTopic === "All" ||
      (lesson.topic && lesson.topic.toLowerCase() === selectedTopic.toLowerCase());

    const matchesLevel = lesson.level?.toLowerCase() === level.toLowerCase();

    return matchesSearch && matchesTopic && matchesLevel;
  });

  const handleStart = (lesson: any) => {
    setActiveLesson(lesson);
    if (lesson.progress > 0 && lesson.progress < 100) {
      const totalEx = lesson.exercises.length;
      const savedIndex = Math.floor((lesson.progress / 100) * totalEx);
      setCurrentExercise(savedIndex >= totalEx ? 0 : savedIndex);
    } else {
      setCurrentExercise(0);
    }
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const handleAnswerSelect = async (index: number) => {
    setSelectedAnswer(index);
    setShowResult(true);

    const totalExercises = activeLesson.exercises.length;
    const currentProgress = Math.round(((currentExercise + 1) / totalExercises) * 100);

    try {
      setLessons(prev => prev.map(l => l._id === activeLesson._id ? { ...l, progress: currentProgress } : l));
      await updateLesson(activeLesson._id, { progress: currentProgress });
    } catch (error) {
      console.error("Progress update error:", error);
    }
  };

  const nextExercise = () => {
    if (activeLesson && currentExercise < activeLesson.exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      handleCompleteLesson();
    }
  };

  const handleCompleteLesson = async () => {
    if (!activeLesson) return;
    try {
      const updated = await updateLesson(activeLesson._id, { progress: 100 });
      setLessons(prev => prev.map(l => l._id === updated._id ? updated : l));
      setActiveLesson(null);
    } catch (error) {
      console.error("Complete lesson error:", error);
      setActiveLesson(null);
    }
  };

  if (loading) return <p className={`p-10 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading lessons...</p>;
  if (error) return <p className="text-red-500 p-10 text-center">{error}</p>;

  return (
    <div className={`relative p-4 pb-20 min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lesson Library</h1>
        <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
          {level.toUpperCase()}
        </span>
      </div>

      <div className="relative mb-4">
        <Search className={`absolute left-3 top-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search lessons..."
          className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-white focus:ring-purple-400' : 'bg-white border-gray-200 focus:ring-purple-500'
            }`}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {dynamicTopics.map((topic: any) => (
          <button
            key={topic}
            onClick={() => setSelectedTopic(topic)}
            className={`px-4 py-1 rounded-full transition-all whitespace-nowrap border ${selectedTopic.toLowerCase() === topic.toLowerCase()
                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                : darkMode ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700" : "bg-gray-200 text-gray-700 border-gray-200 hover:bg-purple-100"
              }`}
          >
            {topic}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredLessons.map((lesson) => (
          <div key={lesson._id} className={`p-4 rounded-xl shadow-sm border transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
            <div className="flex justify-between items-start mb-1">
              <h2 className={`font-bold text-lg leading-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>{formatTitle(lesson.title)}</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${lesson.level?.toLowerCase() === 'advanced' ? "bg-orange-50 text-orange-600 border-orange-200"
                  : lesson.level?.toLowerCase() === 'intermediate' ? "bg-blue-50 text-blue-600 border-blue-200"
                    : "bg-purple-50 text-purple-600 border-purple-200"
                }`}>{lesson.level || 'Beginner'}</span>
            </div>
            <p className="text-xs font-medium text-purple-500 mb-2 uppercase tracking-wide">{lesson.topic}</p>
            <p className={`text-sm mb-3 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{lesson.description}</p>
            <div className={`flex gap-4 text-xs mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              <span className="flex items-center"><Clock size={14} className="mr-1" /> {lesson.duration || "10 min"}</span>
              <span className="flex items-center"><Star size={14} className="mr-1 text-yellow-500" /> {lesson.rating || "4.8"}</span>
            </div>
            <div className={`w-full h-1.5 rounded-full mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className={`h-1.5 rounded-full transition-all duration-500 ${lesson.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${lesson.progress || 0}%` }} />
            </div>
            <button onClick={() => handleStart(lesson)} className={`w-full font-semibold py-2.5 rounded-lg flex justify-center items-center transition-colors shadow-sm ${lesson.progress === 100 ? darkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                : "bg-purple-600 text-white hover:bg-purple-700"
              }`}>
              {lesson.progress === 100 ? <><RotateCcw size={16} className="mr-2" /> Review</> : <><Play size={16} className="mr-2 fill-current" /> Start</>}
            </button>
          </div>
        ))}
      </div>

      {activeLesson && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <button onClick={() => setActiveLesson(null)} className={`absolute top-4 right-4 z-10 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
              <X size={24} />
            </button>
            <div className="p-6 overflow-y-auto">
              <div className="mb-6">
                <span className="text-xs font-bold text-purple-400 uppercase">{activeLesson.topic}</span>
                <h2 className="text-2xl font-black mt-1">{formatTitle(activeLesson.title)}</h2>
              </div>
              {activeLesson.dialogue && currentExercise === 0 && (
                <div className={`p-4 rounded-xl border mb-6 ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                  <h3 className={`text-sm font-bold uppercase mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Conversation</h3>
                  <div className="space-y-3">
                    {activeLesson.dialogue.map((d: any, i: number) => (
                      <div key={i} className="text-sm">
                        <span className="font-bold text-purple-400">{d.speaker}:</span>
                        <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{d.line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeLesson.exercises?.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">Quiz</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                      {currentExercise + 1} / {activeLesson.exercises.length}
                    </span>
                  </div>
                  <p className="text-lg font-semibold">{activeLesson.exercises[currentExercise].question}</p>
                  <div className="space-y-2">
                    {activeLesson.exercises[currentExercise].options.map((option: string, index: number) => (
                      <button key={index} onClick={() => !showResult && handleAnswerSelect(index)} disabled={showResult} className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium ${showResult ? index === activeLesson.exercises[currentExercise].correct ? "bg-green-500/10 border-green-500 text-green-500" : selectedAnswer === index ? "bg-red-500/10 border-red-500 text-red-500" : darkMode ? "bg-transparent border-gray-700 text-gray-600" : "bg-white border-gray-100 text-gray-400"
                          : darkMode ? "bg-gray-900 border-gray-700 hover:border-purple-500 text-gray-300" : "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50"
                        }`}>{option}</button>
                    ))}
                  </div>
                  {showResult && (
                    <div className={`border rounded-xl p-4 animate-in slide-in-from-top-2 ${darkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-100'}`}>
                      <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}><span className="font-bold">Explanation:</span> {activeLesson.exercises[currentExercise].explanation}</p>
                    </div>
                  )}
                  <button onClick={nextExercise} className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg mt-4 ${darkMode ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}>
                    {currentExercise === activeLesson.exercises.length - 1 ? "Finish Lesson" : "Next Question"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};