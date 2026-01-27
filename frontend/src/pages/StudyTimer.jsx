import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Settings as SettingsIcon, Timer, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Topbar } from '../components/Topbar';

const StudyTimer = () => {
  const [mode, setMode] = useState('pomodoro');
  const [sessions, setSessions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  
  // Pomodoro settings
  const [pomodoroSettings, setPomodoroSettings] = useState({
    studyTime: 25,
    breakTime: 5,
    longBreakTime: 15,
    sessionsBeforeLongBreak: 4
  });

  // Load everything on mount
  useEffect(() => {
    loadSettings();
    loadSessions();
    restoreTimerState();
    
    // Update timer every second
    const interval = setInterval(() => {
      updateTimer();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    if (mode === 'pomodoro' || mode === 'stopwatch') {
      saveTimerState();
    }
  }, [mode]);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/timer/settings');
      const data = await response.json();
      if (data.pomodoro) {
        setPomodoroSettings(data.pomodoro);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/timer/sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
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
      loadSessions();
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await fetch(`/api/timer/sessions/${sessionId}`, { method: 'DELETE' });
      loadSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // Persistent timer state management
  const saveTimerState = () => {
    const state = localStorage.getItem('udo_timer_state');
    if (state) {
      localStorage.setItem('udo_timer_state', state);
    }
  };

  const restoreTimerState = () => {
    const saved = localStorage.getItem('udo_timer_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setMode(state.mode || 'pomodoro');
      } catch (error) {
        console.error('Failed to restore timer state:', error);
      }
    }
  };

  const getTimerState = () => {
    const saved = localStorage.getItem('udo_timer_state');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  };

  const setTimerState = (state) => {
    localStorage.setItem('udo_timer_state', JSON.stringify(state));
  };

  const updateTimer = () => {
    const state = getTimerState();
    if (!state || !state.isRunning) return;

    const now = Date.now();
    const elapsed = Math.floor((now - state.lastUpdate) / 1000);
    
    if (elapsed < 1) return;

    if (state.mode === 'pomodoro') {
      const newTimeLeft = Math.max(0, state.timeLeft - elapsed);
      setTimerState({
        ...state,
        timeLeft: newTimeLeft,
        lastUpdate: now
      });

      if (newTimeLeft === 0) {
        // Timer complete
        handlePomodoroComplete(state);
      }
    } else if (state.mode === 'stopwatch') {
      setTimerState({
        ...state,
        elapsed: state.elapsed + elapsed,
        lastUpdate: now
      });
    }
  };

  const handlePomodoroComplete = (state) => {
    const newState = {
      ...state,
      isRunning: false,
      sessionCount: state.sessionCount + 1
    };

    if (state.pomodoroState === 'study') {
      newState.pomodoroState = 'break';
      const isLongBreak = (state.sessionCount + 1) % pomodoroSettings.sessionsBeforeLongBreak === 0;
      newState.timeLeft = isLongBreak ? pomodoroSettings.longBreakTime * 60 : pomodoroSettings.breakTime * 60;
    } else {
      newState.pomodoroState = 'study';
      newState.timeLeft = pomodoroSettings.studyTime * 60;
    }

    setTimerState(newState);

    // Notification
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Udo Timer', {
        body: state.pomodoroState === 'study' ? 'Time for a break!' : 'Time to study!',
        icon: '/favicon.ico'
      });
    }
  };

  const startTimer = () => {
    const state = getTimerState() || {};
    const now = Date.now();

    if (mode === 'pomodoro') {
      setTimerState({
        mode: 'pomodoro',
        isRunning: true,
        timeLeft: state.timeLeft !== undefined ? state.timeLeft : pomodoroSettings.studyTime * 60,
        pomodoroState: state.pomodoroState || 'study',
        sessionCount: state.sessionCount || 0,
        startTime: state.startTime || new Date().toISOString(),
        lastUpdate: now
      });
    } else {
      setTimerState({
        mode: 'stopwatch',
        isRunning: true,
        elapsed: state.elapsed || 0,
        startTime: state.startTime || new Date().toISOString(),
        lastUpdate: now
      });
    }
  };

  const pauseTimer = () => {
    const state = getTimerState();
    if (state) {
      setTimerState({ ...state, isRunning: false });
    }
  };

  const endSession = async () => {
    const state = getTimerState();
    if (!state || !state.startTime) return;

    let duration = 0;
    if (mode === 'pomodoro') {
      const initialTime = pomodoroSettings.studyTime * 60;
      duration = initialTime - (state.timeLeft || initialTime);
    } else {
      duration = state.elapsed || 0;
    }

    if (duration > 0) {
      await saveSession({
        type: mode,
        mode: mode === 'pomodoro' ? state.pomodoroState : undefined,
        startTime: state.startTime,
        endTime: new Date().toISOString(),
        duration: duration
      });
    }

    // Reset timer
    localStorage.removeItem('udo_timer_state');
    if (mode === 'pomodoro') {
      setTimerState({
        mode: 'pomodoro',
        isRunning: false,
        timeLeft: pomodoroSettings.studyTime * 60,
        pomodoroState: 'study',
        sessionCount: 0
      });
    } else {
      setTimerState({
        mode: 'stopwatch',
        isRunning: false,
        elapsed: 0
      });
    }
  };

  const changeMode = (newMode) => {
    const oldState = getTimerState();
    if (oldState && oldState.isRunning) {
      pauseTimer();
    }
    
    setMode(newMode);
    
    if (newMode === 'pomodoro') {
      setTimerState({
        mode: 'pomodoro',
        isRunning: false,
        timeLeft: pomodoroSettings.studyTime * 60,
        pomodoroState: 'study',
        sessionCount: 0
      });
    } else {
      setTimerState({
        mode: 'stopwatch',
        isRunning: false,
        elapsed: 0
      });
    }
  };

  // Get current display time
  const getDisplayTime = () => {
    const state = getTimerState();
    if (!state) {
      return mode === 'pomodoro' ? pomodoroSettings.studyTime * 60 : 0;
    }

    if (state.mode === 'pomodoro') {
      if (state.isRunning) {
        const now = Date.now();
        const elapsed = Math.floor((now - state.lastUpdate) / 1000);
        return Math.max(0, state.timeLeft - elapsed);
      }
      return state.timeLeft;
    } else {
      if (state.isRunning) {
        const now = Date.now();
        const elapsed = Math.floor((now - state.lastUpdate) / 1000);
        return state.elapsed + elapsed;
      }
      return state.elapsed || 0;
    }
  };

  const getTimerStatus = () => {
    const state = getTimerState();
    return {
      isRunning: state?.isRunning || false,
      pomodoroState: state?.pomodoroState || 'study',
      sessionCount: state?.sessionCount || 0
    };
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return {
        hours: hrs.toString().padStart(2, '0'),
        minutes: mins.toString().padStart(2, '0'),
        seconds: secs.toString().padStart(2, '0')
      };
    }
    return {
      hours: null,
      minutes: mins.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0')
    };
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const displayTime = getDisplayTime();
  const timeObj = formatTime(displayTime);
  const status = getTimerStatus();

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Study Timer" />
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Mode Selector */}
          <div className="card p-2 flex gap-2">
            <button
              onClick={() => changeMode('pomodoro')}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'pomodoro'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              <Timer className="w-4 h-4" />
              Pomodoro
            </button>
            <button
              onClick={() => changeMode('stopwatch')}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                mode === 'stopwatch'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              }`}
            >
              <Clock className="w-4 h-4" />
              Stopwatch
            </button>
          </div>

          {/* Timer Display */}
          <div className="card p-12 text-center">
            {mode === 'pomodoro' && (
              <div className="mb-6">
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${
                  status.pomodoroState === 'study'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}>
                  {status.pomodoroState === 'study' ? 'Study Session' : 'Break Time'} • Session {status.sessionCount + 1}
                </span>
              </div>
            )}

            {/* Clock Display */}
            <div className="flex items-center justify-center gap-2 mb-10">
              {timeObj.hours && (
                <>
                  <div className="flex gap-1">
                    <div className="digit-display">{timeObj.hours[0]}</div>
                    <div className="digit-display">{timeObj.hours[1]}</div>
                  </div>
                  <div className="text-6xl font-mono font-bold">:</div>
                </>
              )}
              <div className="flex gap-1">
                <div className="digit-display">{timeObj.minutes[0]}</div>
                <div className="digit-display">{timeObj.minutes[1]}</div>
              </div>
              <div className="text-6xl font-mono font-bold">:</div>
              <div className="flex gap-1">
                <div className="digit-display">{timeObj.seconds[0]}</div>
                <div className="digit-display">{timeObj.seconds[1]}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              {!status.isRunning ? (
                <button onClick={startTimer} className="btn-primary px-8 py-3 text-base">
                  <Play className="w-5 h-5 inline mr-2" />
                  Start
                </button>
              ) : (
                <button onClick={pauseTimer} className="btn-secondary px-8 py-3 text-base">
                  <Pause className="w-5 h-5 inline mr-2" />
                  Pause
                </button>
              )}
              <button onClick={endSession} className="btn-ghost px-8 py-3 text-base border">
                <Square className="w-5 h-5 inline mr-2" />
                End Session
              </button>
              {mode === 'pomodoro' && (
                <button onClick={() => setShowSettings(!showSettings)} className="btn-ghost px-4 py-3 border">
                  <SettingsIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Pomodoro Settings */}
          {showSettings && mode === 'pomodoro' && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Pomodoro Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-muted-foreground">Study Time (min)</label>
                  <input
                    type="number"
                    value={pomodoroSettings.studyTime}
                    onChange={(e) => saveSettings({ ...pomodoroSettings, studyTime: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-muted-foreground">Break Time (min)</label>
                  <input
                    type="number"
                    value={pomodoroSettings.breakTime}
                    onChange={(e) => saveSettings({ ...pomodoroSettings, breakTime: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-muted-foreground">Long Break (min)</label>
                  <input
                    type="number"
                    value={pomodoroSettings.longBreakTime}
                    onChange={(e) => saveSettings({ ...pomodoroSettings, longBreakTime: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-muted-foreground">Sessions Before Long Break</label>
                  <input
                    type="number"
                    value={pomodoroSettings.sessionsBeforeLongBreak}
                    onChange={(e) => saveSettings({ ...pomodoroSettings, sessionsBeforeLongBreak: parseInt(e.target.value) })}
                    className="input"
                    min="1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Session History */}
          <div className="card p-6">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full mb-4"
            >
              <h3 className="font-semibold">Session History</h3>
              {showHistory ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {showHistory && (
              sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sessions yet. Start a timer and click "End Session" to save your work.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {sessions.slice().reverse().map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {session.type === 'pomodoro' ? (
                            <Timer className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium">
                            {session.type === 'pomodoro' ? 'Pomodoro' : 'Stopwatch'}
                            {session.mode && ` (${session.mode})`}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(session.startTime)} • {formatDuration(session.duration)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSession(session.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;
