import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Award, Flame, Calendar, Clock, Star } from 'lucide-react';
import { useTheme } from '../ThemeContext'; // ✅ Theme hook import kiya

interface ProgressData {
  totalLessons: number;
  totalScore: number;
  totalPossible: number;
  byModule: {
    [key: string]: {
      score: number;
      total: number;
      count: number;
    };
  };
}

interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export const Progress: React.FC = () => {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lessonProgress, setLessonProgress] = useState<any[]>([]);
  const [localSpeechCount, setLocalSpeechCount] = useState<number>(0);
  const [localGrammarCount, setLocalGrammarCount] = useState<number>(0);
  const [localVocabCount, setLocalVocabCount] = useState<number>(0);

  const { darkMode } = useTheme(); // ✅ Dark mode state le li

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    // Check local counts
    setLocalSpeechCount(parseInt(localStorage.getItem('speech_practice_count') || '0'));
    setLocalGrammarCount(parseInt(localStorage.getItem('grammar_practice_count') || '0'));
    setLocalVocabCount(parseInt(localStorage.getItem('vocabulary_practice_count') || '0'));
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProgressData();
      fetchAchievements();
      fetchWeeklyData();
      fetchLessonProgress();
    }
  }, [currentUser]);

  const fetchProgressData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/progress/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setProgressData(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/achievements/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/progress/me/weekly`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      // Transform API data to match our format
      const transformedData = [
        { day: 'Mon', minutes: data.find((d: any) => d._id === 2)?.totalMinutes || 0 },
        { day: 'Tue', minutes: data.find((d: any) => d._id === 3)?.totalMinutes || 0 },
        { day: 'Wed', minutes: data.find((d: any) => d._id === 4)?.totalMinutes || 0 },
        { day: 'Thu', minutes: data.find((d: any) => d._id === 5)?.totalMinutes || 0 },
        { day: 'Fri', minutes: data.find((d: any) => d._id === 6)?.totalMinutes || 0 },
        { day: 'Sat', minutes: data.find((d: any) => d._id === 7)?.totalMinutes || 0 },
        { day: 'Sun', minutes: data.find((d: any) => d._id === 1)?.totalMinutes || 0 },
      ];

      setWeeklyData(transformedData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      // Fallback data
      setWeeklyData([
        { day: 'Mon', minutes: 25 }, { day: 'Tue', minutes: 15 },
        { day: 'Wed', minutes: 30 }, { day: 'Thu', minutes: 20 },
        { day: 'Fri', minutes: 35 }, { day: 'Sat', minutes: 40 },
        { day: 'Sun', minutes: 28 },
      ]);
      setLoading(false);
    }
  };

  const fetchLessonProgress = async () => {
    try {
      const response = await fetch(`${API_URL}/api/lessons/progress/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const lessonProgressData = await response.json();
      setLessonProgress(lessonProgressData);
      console.log('Lesson Progress:', lessonProgressData);
    } catch (error) {
      console.error('Fetch lesson progress error:', error);
    }
  };

  // Show login prompt if no user
  if (!currentUser) {
    return (
      <div className={`p-4 pb-20 min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
        <div className="text-center">
          <TrendingUp size={64} className={`${darkMode ? 'text-gray-700' : 'text-gray-300'} mx-auto mb-4`} />
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Track Your Progress</h2>
          <p className={darkMode ? 'text-gray-400 mb-6' : 'text-gray-600 mb-6'}>Please log in to view your learning progress</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Login Now
          </button>
        </div>
      </div>
    );
  }

  const totalMinutes = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes));

  // Use the larger of backend count or local storage count
  const speechPracticeCount = Math.max(progressData?.byModule?.speechRecognition?.count || 0, localSpeechCount);
  const grammarPracticeCount = Math.max(progressData?.byModule?.grammar?.count || 0, localGrammarCount);
  const vocabPracticeCount = Math.max(progressData?.byModule?.vocabulary?.count || 0, localVocabCount);

  const speechPracticeScore = progressData?.byModule?.speechRecognition?.score;
  const speechPracticeTotal = progressData?.byModule?.speechRecognition?.total || 25;
  const speechProgressNumerator =
    speechPracticeScore !== undefined && speechPracticeScore !== null
      ? speechPracticeScore
      : speechPracticeCount;
  const speechPracticePercent = speechPracticeTotal > 0
    ? Math.min((speechProgressNumerator / speechPracticeTotal) * 100, 100)
    : 0;

  //  Default achievements if none from backend
  const defaultAchievements = [
    { _id: '1', title: '7-Day Streak', description: 'Practice 7 days in a row', icon: 'flame', earned: true },
    { _id: '2', title: 'Grammar Master', description: 'Complete 50 grammar exercises', icon: 'award', earned: grammarPracticeCount >= 10 },
    { _id: '3', title: 'Vocabulary Builder', description: 'Learn 100 new words', icon: 'target', earned: vocabPracticeCount >= 20 },
    { _id: '4', title: 'Consistent Learner', description: 'Practice 5 days in a row', icon: 'star', earned: weeklyData.filter(d => d.minutes > 0).length >= 5 },
  ];

  const displayAchievements = achievements.length > 0 ? achievements : defaultAchievements;

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      flame: Flame,
      award: Award,
      star: Star,
      target: Target
    };
    return icons[iconName] || Award;
  };

  if (loading) {
    return (
      <div className={`p-4 pb-20 min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 pb-20 min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
      {/* Header */}
      <div className="mb-6 pt-4">
        <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Your Progress</h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Track your learning journey</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4`}>
          <div className="flex items-center mb-2">
            <Flame className="text-orange-500 mr-2" size={20} />
            <span className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Current Streak</span>
          </div>
          <div className="text-2xl font-bold text-orange-500">
            {weeklyData.filter(d => d.minutes > 0).length} days
          </div>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4`}>
          <div className="flex items-center mb-2">
            <Clock className="text-blue-500 mr-2" size={20} />
            <span className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>This Week</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{totalMinutes}m</div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Weekly Activity</h3>
          <TrendingUp className="text-green-500" size={20} />
        </div>

        <div className="flex items-end justify-between space-x-2 mb-4">
          {weeklyData.map((day) => (
            <div key={day.day} className="flex flex-col items-center flex-1">
              <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-20 flex items-end`}>
                <div
                  className="w-full bg-gradient-to-t from-blue-400 to-blue-500 rounded-full transition-all duration-300"
                  style={{
                    height: maxMinutes > 0 ? `${(day.minutes / maxMinutes) * 100}%` : '0%',
                    minHeight: day.minutes > 0 ? '10%' : '0%'
                  }}
                ></div>
              </div>
              <span className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{day.day}</span>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{day.minutes}m</span>
            </div>
          ))}
        </div>

        <div className={`${darkMode ? 'bg-green-900/20' : 'bg-green-50'} rounded-xl p-3`}>
          <p className={`${darkMode ? 'text-green-400' : 'text-green-700'} text-sm`}>
            <span className="font-semibold">
              {weeklyData.filter(d => d.minutes > 0).length === 7 ? 'Perfect week!' :
                weeklyData.filter(d => d.minutes > 0).length >= 5 ? 'Great consistency!' :
                  'Keep going! '}
            </span>
            You practiced {weeklyData.filter(d => d.minutes > 0).length} days this week.
          </p>
        </div>
      </div>

      {/* Learning Stats - Now with Real Data */}
      <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4 mb-6`}>
        <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Learning Stats</h3>

        <div className="space-y-4">
          {/* Learning Stats ke andar yeh ADD KARO */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Lesson Library Progress</p>
              <p className={darkMode ? 'text-gray-500 text-sm' : 'text-gray-500 text-sm'}>Completed lessons</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">
                {lessonProgress.filter((l: any) => l.progress === 100).length}
              </p>
              <div className={`w-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1`}>
                <div
                  className="bg-indigo-500 h-1 rounded-full"
                  style={{ width: `${Math.min((lessonProgress.filter((l: any) => l.progress === 100).length / (lessonProgress.length || 1)) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Lessons Completed</p>
              <p className={darkMode ? 'text-gray-500 text-sm' : 'text-gray-500 text-sm'}>Total progress</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">
                {progressData?.totalLessons || 0}
              </p>
              <div className={`w-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1`}>
                <div
                  className="bg-purple-500 h-1 rounded-full"
                  style={{ width: `${Math.min(((progressData?.totalLessons || 0) / 50) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Words Learned</p>
              <p className={darkMode ? 'text-gray-500 text-sm' : 'text-gray-500 text-sm'}>Vocabulary expansion</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {vocabPracticeCount}
              </p>
              <div className={`w-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1`}>
                <div
                  className="bg-green-500 h-1 rounded-full"
                  style={{ width: `${Math.min((vocabPracticeCount / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Grammar Exercises</p>
              <p className={darkMode ? 'text-gray-500 text-sm' : 'text-gray-500 text-sm'}>Practice completed</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {grammarPracticeCount}
              </p>
              <div className={`w-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1`}>
                <div
                  className="bg-blue-500 h-1 rounded-full"
                  style={{ width: `${Math.min((grammarPracticeCount / 25) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Speech Recognition</p>
              <p className={darkMode ? 'text-gray-500 text-sm' : 'text-gray-500 text-sm'}>Pronunciation practice</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-600">
                {speechPracticeCount}
              </p>
              <div className={`w-16 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1`}>
                <div
                  className="bg-orange-500 h-1 rounded-full"
                  style={{ width: `${speechPracticePercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4 mb-6`}>
        <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Achievements</h3>

        <div className="grid grid-cols-2 gap-3">
          {displayAchievements.map((achievement) => {
            const IconComponent = getIconComponent(achievement.icon);
            return (
              <div
                key={achievement._id}
                className={`p-3 rounded-xl border-2 transition-all ${achievement.earned
                  ? (darkMode ? 'bg-yellow-900/10 border-yellow-800/50' : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200')
                  : (darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200')
                  }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${achievement.earned
                    ? (darkMode ? 'bg-gray-800 shadow-sm' : 'bg-white shadow-sm')
                    : (darkMode ? 'bg-gray-700' : 'bg-gray-200')
                    }`}>
                    <IconComponent
                      size={20}
                      className={achievement.earned ? 'text-yellow-500' : (darkMode ? 'text-gray-600' : 'text-gray-400')}
                    />
                  </div>
                  <h4 className={`font-medium text-sm mb-1 ${achievement.earned
                    ? (darkMode ? 'text-yellow-500' : 'text-gray-800')
                    : (darkMode ? 'text-gray-600' : 'text-gray-500')
                    }`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-[10px] leading-tight ${achievement.earned
                    ? (darkMode ? 'text-gray-400' : 'text-gray-600')
                    : (darkMode ? 'text-gray-700' : 'text-gray-400')
                    }`}>
                    {achievement.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goals */}
      <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Current Goals</h3>
          <Target className="text-purple-500" size={20} />
        </div>

        <div className="space-y-3">
          <div className={`${darkMode ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-xl p-3`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${darkMode ? 'text-purple-300' : 'text-purple-800'}`}>Daily Practice Goal</span>
              <span className="text-purple-500 text-sm">
                {totalMinutes}/30 min
              </span>
            </div>
            <div className={`w-full ${darkMode ? 'bg-purple-900/40' : 'bg-purple-200'} rounded-full h-2`}>
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${Math.min((totalMinutes / 30) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-xl p-3`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>Weekly Lessons</span>
              <span className="text-blue-500 text-sm">
                {progressData?.totalLessons || 0}/7 lessons
              </span>
            </div>
            <div className={`w-full ${darkMode ? 'bg-blue-900/40' : 'bg-blue-200'} rounded-full h-2`}>
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min(((progressData?.totalLessons || 0) / 7) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};