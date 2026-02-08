import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Target, Award, Flame, Clock, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../ThemeContext';

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
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [lessonProgress, setLessonProgress] = useState<any[]>([]);
  const [localSpeechCount, setLocalSpeechCount] = useState<number>(0);
  const [localGrammarCount, setLocalGrammarCount] = useState<number>(0);
  const [localVocabCount, setLocalVocabCount] = useState<number>(0);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0); // Live session counter (resets on refresh/logout)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    return sunday;
  });
  
  const { darkMode } = useTheme();
  
  const accumulatedSecondsRef = useRef<number>(0); // Live session tracking only
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const secondTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get Pakistan time (UTC+5)
  const getPakistanNow = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (5 * 60 * 60000));
  };

  const getTodayKey = () => {
    const pakNow = getPakistanNow();
    const yyyy = pakNow.getFullYear();
    const mm = String(pakNow.getMonth() + 1).padStart(2, '0');
    const dd = String(pakNow.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDateKey = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getDateFromKey = (dateKey: string) => {
    return new Date(dateKey + 'T00:00:00+05:00');
  };

  // Convert accumulated seconds to minutes and send to backend
  const flushSecondsToMinutes = async () => {
    const totalSeconds = accumulatedSecondsRef.current;
    if (totalSeconds < 60) return; // Only send when we have at least 1 minute
    
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    
    // Keep only remaining seconds for current session
    accumulatedSecondsRef.current = remainingSeconds;
    setSessionSeconds(remainingSeconds);
    
    console.debug('[Progress] Flushing seconds to minutes', { 
      totalSeconds, 
      minutes, 
      remainingSeconds 
    });
    
    await sendMinutesToBackend(minutes);
    fetchWeeklyDataForWeek(currentWeekStart);
  };

  // Send minutes to backend
  const sendMinutesToBackend = async (minutes: number) => {
    if (!minutes || minutes <= 0) return;
    
    // Save to localStorage
    const todayKey = getTodayKey();
    const currentMinutes = parseInt(localStorage.getItem(`minutes_${todayKey}`) || '0');
    localStorage.setItem(`minutes_${todayKey}`, String(currentMinutes + minutes));
    
    // Try to send to backend if logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.debug('[Progress] Not logged in, saved locally only');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module: 'session',
          minutes: minutes,
          score: minutes,
          total: 1440
        })
      });
      
      if (response.ok) {
        console.debug('[Progress] Minutes sent successfully', { minutes });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending session minutes:', error);
      const failedMinutes = parseInt(localStorage.getItem('failed_minutes') || '0');
      localStorage.setItem('failed_minutes', String(failedMinutes + minutes));
    }
  };

  // Track user activity
  const trackActivity = () => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current > 2 * 60 * 1000) {
      console.debug('[Progress] User became active after inactivity');
    }
    lastUpdateTimeRef.current = now;
  };

  // Update accumulated seconds (runs every second)
  const updateSeconds = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastUpdateTimeRef.current;
    
    // Only count seconds if: tab visible and user active in last 5 minutes
    if (!document.hidden && timeSinceLastActivity < 5 * 60 * 1000) {
      accumulatedSecondsRef.current += 1;
      setSessionSeconds(accumulatedSecondsRef.current);
      
      // Note: We don't auto-flush here to keep continuous display
      // The 2-minute interval timer handles flushing to backend
    }
  };

  // Get week data for a specific week start date (Sunday)
  const getWeekData = (weekStartDate: Date) => {
    const weekData = [];
    const weekStart = new Date(weekStartDate);
    const today = new Date(getTodayKey());
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      
      const dateKey = getDateKey(dayDate);
      const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNumber = dayDate.getDate();
      const month = dayDate.toLocaleDateString('en-US', { month: 'short' });
      
      // Get minutes from localStorage (already sent to backend)
      const minutes = parseInt(localStorage.getItem(`minutes_${dateKey}`) || '0');
      
      let totalMinutes = minutes;
      const isToday = dateKey === getTodayKey();

      // Add current live session seconds as minutes (for display only)
      if (isToday) {
        const secondsAsMinutes = Math.floor(sessionSeconds / 60);
        totalMinutes += secondsAsMinutes;
      }

      const dayDateAtMidnight = new Date(dayDate);
      dayDateAtMidnight.setHours(0, 0, 0, 0);

      weekData.push({
        date: dateKey,
        dayName,
        dayNumber,
        month,
        fullDate: dayDate,
        minutes: Math.min(totalMinutes, 1440),
        isToday,
        isPast: dayDateAtMidnight < today,
        isFuture: dayDateAtMidnight > today,
      });
    }
    
    return weekData;
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
    fetchWeeklyDataForWeek(newWeekStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    const today = new Date(getTodayKey());
    const nextWeekSunday = new Date(newWeekStart);
    nextWeekSunday.setDate(newWeekStart.getDate() + 6);

    if (nextWeekSunday <= today) {
      setCurrentWeekStart(newWeekStart);
      fetchWeeklyDataForWeek(newWeekStart);
    }
  };

  // Go to current week
  const goToCurrentWeek = () => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    setCurrentWeekStart(sunday);
    fetchWeeklyDataForWeek(sunday);
  };

  // Fetch weekly data for specific week
  const fetchWeeklyDataForWeek = async (weekStartDate: Date) => {
    try {
      const token = localStorage.getItem('token');
      const weekData = getWeekData(weekStartDate);
      
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/progress/me/weekly`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const serverWeeklyData = await response.json();
            
            const mergedData = weekData.map(day => {
              const dayOfWeek = day.fullDate.getDay();
              const serverId = dayOfWeek === 0 ? 1 : dayOfWeek + 1;
              const serverEntry = serverWeeklyData.find((d: any) => d._id === serverId);
              let serverMinutes = 0;
              
              if (serverEntry) {
                const serverDate = getDateFromKey(serverEntry.day || '');
                if (serverDate && getDateKey(serverDate) === day.date) {
                  serverMinutes = serverEntry.totalMinutes || 0;
                }
              }
              
              const minutes = Math.max(day.minutes, serverMinutes);
              
              return {
                ...day,
                minutes: Math.min(minutes, 1440),
              };
            });
            
            setWeeklyData(mergedData);
          } else {
            setWeeklyData(weekData);
          }
        } catch (error) {
          console.error('Error fetching server weekly data:', error);
          setWeeklyData(weekData);
        }
      } else {
        setWeeklyData(weekData);
      }
      
    } catch (error) {
      console.error('Error in fetchWeeklyDataForWeek:', error);
      setWeeklyData(getWeekData(weekStartDate));
    }
  };

  // Initialize tracking - SESSION ONLY (resets on refresh/logout)
  useEffect(() => {
    // Start fresh session (do NOT load saved seconds)
    accumulatedSecondsRef.current = 0;
    setSessionSeconds(0);
    console.debug('[Progress] Started new session - counter reset to 0');
    
    // Set up event listeners for user activity
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, trackActivity);
    });
    
    // Start second timer for counting
    secondTimerRef.current = setInterval(updateSeconds, 1000);
    
    // Auto-flush timer (every 2 minutes)
    flushTimerRef.current = setInterval(() => {
      if (accumulatedSecondsRef.current >= 60) {
        flushSecondsToMinutes();
      }
    }, 2 * 60 * 1000);
    
    return () => {
      // Cleanup event listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });
      
      // Flush any remaining seconds before unmount
      if (accumulatedSecondsRef.current >= 60) {
        flushSecondsToMinutes();
      }
      
      // Clear timers
      if (secondTimerRef.current) clearInterval(secondTimerRef.current);
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    setLocalSpeechCount(parseInt(localStorage.getItem('speech_practice_count') || '0'));
    setLocalGrammarCount(parseInt(localStorage.getItem('grammar_practice_count') || '0'));
    setLocalVocabCount(parseInt(localStorage.getItem('vocabulary_practice_count') || '0'));
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProgressData();
      fetchAchievements();
      fetchLessonProgress();
      fetchWeeklyDataForWeek(currentWeekStart);
      retryFailedMinutes();
    }
  }, [currentUser]);

  // When sessionSeconds changes, update today's data in weeklyData
  useEffect(() => {
    if (weeklyData.length > 0) {
      const updatedData = weeklyData.map(day => {
        if (day.date === getTodayKey()) {
          const minutes = parseInt(localStorage.getItem(`minutes_${day.date}`) || '0');
          const secondsAsMinutes = Math.floor(sessionSeconds / 60);
          return {
            ...day,
            minutes: Math.min(minutes + secondsAsMinutes, 1440),
          };
        }
        return day;
      });
      setWeeklyData(updatedData);
    }
  }, [sessionSeconds]);

  // Retry failed minutes
  const retryFailedMinutes = async () => {
    const failedMinutes = parseInt(localStorage.getItem('failed_minutes') || '0');
    if (failedMinutes > 0 && currentUser) {
      console.debug('[Progress] Retrying failed minutes', { failedMinutes });
      await sendMinutesToBackend(failedMinutes);
      localStorage.setItem('failed_minutes', '0');
    }
  };

  // Refresh data periodically
  useEffect(() => {
    if (!currentUser) return;
    
    const intervalId = setInterval(() => {
      fetchProgressData();
      retryFailedMinutes();
      fetchWeeklyDataForWeek(currentWeekStart);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentUser, currentWeekStart]);

  // Check if it's a new day (midnight PKT)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const checkNewDay = () => {
      const pakNow = getPakistanNow();
      const tomorrow = new Date(pakNow);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const msUntilTomorrow = tomorrow.getTime() - pakNow.getTime();
      
      timeoutId = setTimeout(() => {
        console.debug('[Progress] New day detected (midnight PKT)');
        // Reset session for new day
        accumulatedSecondsRef.current = 0;
        setSessionSeconds(0);
        fetchWeeklyDataForWeek(currentWeekStart);
        checkNewDay();
      }, msUntilTomorrow);
    };
    
    checkNewDay();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentWeekStart]);

  const fetchProgressData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/progress/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/achievements/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAchievements(data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchLessonProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/lessons/progress/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const lessonProgressData = await response.json();
      setLessonProgress(lessonProgressData);
    } catch (error) {
      console.error('Fetch lesson progress error:', error);
    }
  };

  // Format minutes to hours and minutes
  const formatHours = (minutes: number) => {
    const clampedMinutes = Math.min(Math.round(minutes), 1440);
    if (clampedMinutes < 60) return `${clampedMinutes}m`;

    const hours = Math.floor(clampedMinutes / 60);
    const remainingMinutes = clampedMinutes % 60;
    
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes.toString().padStart(2, '0')}m`;
  };

  // Format week range
  const formatWeekRange = () => {
    const weekStart = new Date(currentWeekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
    const year = weekStart.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${year}`;
    } else {
      return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${year}`;
    }
  };

  // Format session display: shows cumulative time (0 sec, 59 sec, 1 min 1 sec, 2 min 30 sec, etc.)
  const formatSessionDisplay = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes === 0) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} min ${seconds} sec`;
    }
  };

  const weekTotalMinutes = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
  const maxMinutes = Math.max(10, ...weeklyData.map(d => d.minutes));

  const isCurrentWeek = () => {
    const today = new Date();
    const currentWeekSunday = new Date(today);
    currentWeekSunday.setDate(today.getDate() - today.getDay());
    currentWeekSunday.setHours(0, 0, 0, 0);
    
    const viewedWeekStart = new Date(currentWeekStart);
    viewedWeekStart.setHours(0, 0, 0, 0);
    
    return viewedWeekStart.getTime() === currentWeekSunday.getTime();
  };

  const canGoToNextWeek = () => {
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    const today = new Date(getTodayKey());
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    
    return nextWeekEnd <= today;
  };

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

  const defaultAchievements = [
    { _id: '1', title: '7-Day Streak', description: 'Practice 7 days in a row', icon: 'flame', earned: false },
    { _id: '2', title: 'Grammar Master', description: 'Complete 50 grammar exercises', icon: 'award', earned: grammarPracticeCount >= 10 },
    { _id: '3', title: 'Vocabulary Builder', description: 'Learn 100 new words', icon: 'target', earned: vocabPracticeCount >= 20 },
    { _id: '4', title: 'Consistent Learner', description: 'Practice 5 days in a row', icon: 'star', earned: false },
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
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            This week
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4`}>
          <div className="flex items-center mb-2">
            <Clock className="text-blue-500 mr-2" size={20} />
            <span className={darkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>This Week</span>
          </div>
          <div className="text-2xl font-bold text-blue-500">{formatHours(weekTotalMinutes)}</div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            {formatWeekRange()}
          </p>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4 mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Weekly Activity</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatWeekRange()}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {sessionSeconds > 0 && isCurrentWeek() && (
              <div className={`px-2 py-1 rounded-full text-xs ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} animate-pulse`}></div>
                  Learning Now
                </div>
              </div>
            )}
            
            {!isCurrentWeek() && (
              <button
                onClick={goToCurrentWeek}
                className={`px-3 py-1 text-xs rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Current Week
              </button>
            )}
            <button
              onClick={goToPreviousWeek}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ChevronLeft size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
            <button
              onClick={goToNextWeek}
              disabled={!canGoToNextWeek()}
              className={`p-2 rounded-full ${!canGoToNextWeek() ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <ChevronRight size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>
        </div>

        <div className="flex items-end justify-between space-x-1 mb-4">
          {weeklyData.map((day) => (
            <div key={day.date} className="flex flex-col items-center flex-1">
              <div className={`w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-20 flex items-end overflow-hidden`}>
                <div
                  className={`w-full rounded-full transition-all duration-300 ${
                    day.isToday 
                      ? 'bg-gradient-to-t from-green-400 to-green-500' 
                      : day.isPast
                      ? 'bg-gradient-to-t from-blue-400 to-blue-500'
                      : 'bg-gradient-to-t from-gray-300 to-gray-400'
                  }`}
                  style={{
                    height: maxMinutes > 0 ? `${(day.minutes / maxMinutes) * 100}%` : '0%',
                    minHeight: day.minutes > 0 ? '10%' : '0%'
                  }}
                ></div>
              </div>
              <span className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {day.dayName}
              </span>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {day.dayNumber} {day.month}
              </span>
              <span className={`text-xs font-medium mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {formatHours(day.minutes)}
              </span>
            </div>
          ))}
        </div>

        <div className={`${darkMode ? 'bg-green-900/20' : 'bg-green-50'} rounded-xl p-3`}>
          <p className={`${darkMode ? 'text-green-400' : 'text-green-700'} text-sm`}>
            {isCurrentWeek() ? (
              <>
                <span className="font-semibold">
                  {weeklyData.filter(d => d.minutes > 0).length === 7 ? 'Perfect week! ' :
                    weeklyData.filter(d => d.minutes > 0).length >= 5 ? 'Great consistency! ' :
                      'Keep going! '}
                </span>
                You practiced {weeklyData.filter(d => d.minutes > 0).length} days this week.
                
                {sessionSeconds > 0 && (
                  <span className="block mt-1 text-xs">
                    Current session: {formatSessionDisplay(sessionSeconds)}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="font-semibold">Great Effort!</span> You practiced {weeklyData.filter(d => d.minutes > 0).length} days.
                <span className="block mt-1 text-xs">
                  Total: {formatHours(weekTotalMinutes)}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Learning Stats */}
      <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm'} rounded-2xl p-4 mb-6`}>
        <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Learning Stats</h3>

        <div className="space-y-4">
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
    </div>
  );
};