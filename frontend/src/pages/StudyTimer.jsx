import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock, Timer, Trash2 } from 'lucide-react';

const StudyTimer = () => {
  // Mode: 'pomodoro' or 'stopwatch'
  const [mode, setMode] = useState('pomodoro');
  
  // Pomodoro state
  const [pomodoroSettings, setPomodoroSettings] = useState({
    studyTime: 25,
    breakTime: 5,
    longBreakTime: 15,
    sessionsBeforeLongBreak: 4
  });
  const [pomodoroState, setPomodoroState] = useState('study'); // 'study' or 'break'
  const [sessionCount, setSessionCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  
  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0); // seconds
  
  // Common state
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionStart, setCurrentSessionStart] = useState(null);
  
  const intervalRef = useRef(null);

  // Load settings and sessions
  useEffect(() => {
    fetchSettings();
    fetchSessions();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/timer/settings');
      const data = await response.json();
      if (data.pomodoro) {
        setPomodoroSettings(data.pomodoro);
        setTimeLeft(data.pomodoro.studyTime * 60);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/timer/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await fetch('/api/timer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pomodoro: newSettings })
      });
      setPomodoroSettings(newSettings);
      if (!isRunning && pomodoroState === 'study') {
        setTimeLeft(newSettings.studyTime * 60);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const saveSession = async (sessionData) => {
    try {
      await fetch('/api/timer/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      fetchSessions();
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await fetch(`/api/timer/sessions/${sessionId}`, { method: 'DELETE' });
      fetchSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // Pomodoro timer logic
  useEffect(() => {
    if (mode === 'pomodoro' && isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handlePomodoroComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [mode, isRunning, timeLeft]);

  // Stopwatch logic
  useEffect(() => {
    if (mode === 'stopwatch' && isRunning) {
      intervalRef.current = setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [mode, isRunning]);

  const handlePomodoroComplete = () => {
    setIsRunning(false);
    
    // Save session
    if (pomodoroState === 'study' && currentSessionStart) {
      const duration = pomodoroSettings.studyTime * 60;
      saveSession({
        type: 'pomodoro',
        mode: pomodoroState,
        startTime: currentSessionStart,
        endTime: new Date().toISOString(),
        duration: duration
      });
    }

    // Switch state
    if (pomodoroState === 'study') {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      
      if (newSessionCount % pomodoroSettings.sessionsBeforeLongBreak === 0) {
        setTimeLeft(pomodoroSettings.longBreakTime * 60);
      } else {
        setTimeLeft(pomodoroSettings.breakTime * 60);
      }
      setPomodoroState('break');
    } else {
      setTimeLeft(pomodoroSettings.studyTime * 60);
      setPomodoroState('study');
    }
    
    // Play notification sound (optional)
    playNotificationSound();
  };

  const playNotificationSound = () => {
    // You can add audio notification here
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Udo Timer', {
        body: pomodoroState === 'study' ? 'Time for a break!' : 'Time to study!',
        icon: '/favicon.ico'
      });
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    if (!currentSessionStart) {
      setCurrentSessionStart(new Date().toISOString());
    }
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    
    // Save session if there was progress
    if (mode === 'pomodoro' && currentSessionStart) {
      const duration = (pomodoroSettings.studyTime * 60) - timeLeft;
      if (duration > 0) {
        saveSession({
          type: 'pomodoro',
          mode: pomodoroState,
          startTime: currentSessionStart,
          endTime: new Date().toISOString(),
          duration: duration,
          completed: false
        });
      }
    } else if (mode === 'stopwatch' && stopwatchTime > 0 && currentSessionStart) {
      saveSession({
        type: 'stopwatch',
        startTime: currentSessionStart,
        endTime: new Date().toISOString(),
        duration: stopwatchTime
      });
    }
    
    // Reset state
    setCurrentSessionStart(null);
    if (mode === 'pomodoro') {
      setTimeLeft(pomodoroSettings.studyTime * 60);
      setPomodoroState('study');
    } else {
      setStopwatchTime(0);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Study Timer</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => {
              setMode('pomodoro');
              setIsRunning(false);
              setTimeLeft(pomodoroSettings.studyTime * 60);
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              mode === 'pomodoro'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
            }`}
          >
            <Timer className="w-5 h-5 inline mr-2" />
            Pomodoro
          </button>
          <button
            onClick={() => {
              setMode('stopwatch');
              setIsRunning(false);
              setStopwatchTime(0);
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
              mode === 'stopwatch'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'
            }`}
          >
            <Clock className="w-5 h-5 inline mr-2" />
            Stopwatch
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && mode === 'pomodoro' && (
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-800 animate-fade-in-up">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Pomodoro Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Study Time (minutes)
                </label>
                <input
                  type="number"
                  value={pomodoroSettings.studyTime}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, studyTime: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Break Time (minutes)
                </label>
                <input
                  type="number"
                  value={pomodoroSettings.breakTime}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, breakTime: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Long Break Time (minutes)
                </label>
                <input
                  type="number"
                  value={pomodoroSettings.longBreakTime}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, longBreakTime: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Sessions Before Long Break
                </label>
                <input
                  type="number"
                  value={pomodoroSettings.sessionsBeforeLongBreak}
                  onChange={(e) => saveSettings({ ...pomodoroSettings, sessionsBeforeLongBreak: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  min="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-12 mb-6 border border-gray-200 dark:border-gray-800 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {mode === 'pomodoro' && (
            <div className="mb-4">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                pomodoroState === 'study'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              }`}>
                {pomodoroState === 'study' ? 'Study Session' : 'Break Time'} • Session {sessionCount + 1}
              </span>
            </div>
          )}
          
          <div className="text-8xl font-bold text-gray-900 dark:text-white mb-8 font-mono timer-display">
            {mode === 'pomodoro' ? formatTime(timeLeft) : formatTime(stopwatchTime)}
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-8 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        {/* Session History */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Session History</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No sessions recorded yet. Start a timer to log your study sessions!</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.slice().reverse().map((session, index) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {session.type === 'pomodoro' ? (
                        <Timer className="w-4 h-4 text-blue-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-green-500" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {session.type === 'pomodoro' ? 'Pomodoro' : 'Stopwatch'}
                        {session.mode && ` - ${session.mode}`}
                      </span>
                      {session.completed === false && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                          Incomplete
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(session.startTime)} • Duration: {formatDuration(session.duration)}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;
