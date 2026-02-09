import { useEffect, useRef } from 'react';

/**
 * Global Progress Tracking Hook - Syncs with MongoDB
 * Place this in your App.tsx or main layout component
 * Tracks time across all pages and syncs to backend
 */
export const useProgressTracking = () => {
  const accumulatedSecondsRef = useRef<number>(0);
  const lastFlushedMinutesRef = useRef<number>(0); // Track flushed minutes to avoid re-sending
  const lastActivityTimeRef = useRef<number>(Date.now());
  const secondTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const API_URL = import.meta.env.VITE_API_URL;

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

  // Load today's session from MongoDB
  const loadTodaySession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.debug('[ProgressTracking] Not logged in, starting fresh');
      accumulatedSecondsRef.current = 0;
      localStorage.setItem(`unflushed_seconds_${getTodayKey()}`, '0');
      return;
    }

    try {
      const todayKey = getTodayKey();
      const response = await fetch(`${API_URL}/api/session/get-day/${todayKey}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        // ✅ ALWAYS start session from 0 seconds on refresh/login
        accumulatedSecondsRef.current = 0;
        
        // Update localStorage - keep saved minutes but reset current session seconds
        localStorage.setItem(`unflushed_seconds_${todayKey}`, '0');
        localStorage.setItem(`minutes_${todayKey}`, String(data.minutes || 0));
        
        console.debug('[ProgressTracking] Loaded from MongoDB (session reset to 0):', {
          minutes: data.minutes,
          sessionSeconds: 0
        });
      }
    } catch (error) {
      console.error('[ProgressTracking] Error loading session:', error);
      // Fallback to 0
      accumulatedSecondsRef.current = 0;
    }
  };

  // Sync seconds to MongoDB (called every 10 seconds)
  const syncSecondsToBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const todayKey = getTodayKey();
    const totalSeconds = accumulatedSecondsRef.current;

    try {
      await fetch(`${API_URL}/api/session/update-seconds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: todayKey,
          seconds: totalSeconds
        })
      });

      // Update localStorage for local display
      localStorage.setItem(`unflushed_seconds_${todayKey}`, String(totalSeconds));
      
      console.debug('[ProgressTracking] Synced seconds to MongoDB:', totalSeconds);
    } catch (error) {
      console.error('[ProgressTracking] Sync error:', error);
    }
  };

  // Flush minutes to MongoDB (called when >= 60 seconds)
  const flushMinutesToBackend = async () => {
    const totalSeconds = accumulatedSecondsRef.current;
    if (totalSeconds < 60) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.debug('[ProgressTracking] Not logged in, cannot flush');
      return;
    }

    const currentMinutes = Math.floor(totalSeconds / 60);
    const minutesToFlush = currentMinutes - lastFlushedMinutesRef.current;
    
    if (minutesToFlush <= 0) return; // Nothing new to flush

    try {
      const todayKey = getTodayKey();
      const response = await fetch(`${API_URL}/api/session/flush-minutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: todayKey,
          minutes: minutesToFlush
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update last flushed minutes (DON'T reset accumulated seconds)
        lastFlushedMinutesRef.current = currentMinutes;
        
        // Update localStorage
        localStorage.setItem(`minutes_${todayKey}`, String(data.totalMinutes));
        localStorage.setItem(`unflushed_seconds_${todayKey}`, String(totalSeconds));
        
        console.debug('[ProgressTracking] Flushed to MongoDB:', {
          minutesFlushed: minutesToFlush,
          totalMinutes: data.totalMinutes,
          currentSessionSeconds: totalSeconds
        });

        // Broadcast update for Progress component
        window.dispatchEvent(new CustomEvent('progress-updated', {
          detail: { totalMinutes: data.totalMinutes }
        }));
      }
    } catch (error) {
      console.error('[ProgressTracking] Flush error:', error);
      // Store failed minutes for retry
      const failedMinutes = parseInt(localStorage.getItem('failed_minutes') || '0');
      localStorage.setItem('failed_minutes', String(failedMinutes + minutesToFlush));
    }
  };

  // Track user activity
  const trackActivity = () => {
    const now = Date.now();
    if (now - lastActivityTimeRef.current > 2 * 60 * 1000) {
      console.debug('[ProgressTracking] User became active after inactivity');
    }
    lastActivityTimeRef.current = now;
  };

  // Update seconds counter
  const updateSeconds = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTimeRef.current;

    // Only count if tab visible and user active in last 5 minutes
    if (!document.hidden && timeSinceLastActivity < 5 * 60 * 1000) {
      accumulatedSecondsRef.current += 1;
      
      // Update localStorage for immediate local display
      const todayKey = getTodayKey();
      localStorage.setItem(`unflushed_seconds_${todayKey}`, String(accumulatedSecondsRef.current));
      
      // Broadcast to Progress component
      window.dispatchEvent(new CustomEvent('progress-tick', {
        detail: { seconds: accumulatedSecondsRef.current }
      }));
      
      // Auto-flush when we hit 60 seconds
      if (accumulatedSecondsRef.current >= 60 && accumulatedSecondsRef.current % 60 === 0) {
        flushMinutesToBackend();
      }
    }
  };

  useEffect(() => {
    // Load session from MongoDB on mount
    loadTodaySession();

    // Set up activity tracking
    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, trackActivity);
    });

    // Start second counter (runs every second)
    secondTimerRef.current = setInterval(updateSeconds, 1000);

    // Sync to MongoDB every 10 seconds (backup sync)
    syncTimerRef.current = setInterval(syncSecondsToBackend, 10 * 1000);

    // Auto-flush timer (every 2 minutes)
    flushTimerRef.current = setInterval(() => {
      if (accumulatedSecondsRef.current >= 60) {
        flushMinutesToBackend();
      }
    }, 2 * 60 * 1000);

    return () => {
      // Cleanup
      activityEvents.forEach(event => {
        document.removeEventListener(event, trackActivity);
      });

      // Final sync before unmount
      if (accumulatedSecondsRef.current > 0) {
        syncSecondsToBackend();
      }
      
      // Final flush if we have unflushed complete minutes
      const currentMinutes = Math.floor(accumulatedSecondsRef.current / 60);
      if (currentMinutes > lastFlushedMinutesRef.current) {
        flushMinutesToBackend();
      }

      if (secondTimerRef.current) clearInterval(secondTimerRef.current);
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
    };
  }, []);

  // Return nothing - this is a fire-and-forget hook
  return null;
};