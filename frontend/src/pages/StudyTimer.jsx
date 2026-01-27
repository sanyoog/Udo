import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Settings as SettingsIcon, Timer, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Topbar } from '../components/Topbar';

const StudyTimer = () => {
  const [mode, setMode] = useState('pomodoro');
  const [sessions, setSessions] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [displayTime, setDisplayTime] = useState(0);
  const [timerStatus, setTimerStatus] = useState({ isRunning: false, pomodoroState: 'study', sessionCount: 0 });
  const [expandedSession, setExpandedSession] = useState(null);
  
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
    loadActiveTimer();
    
    // Update timer every second
    const interval = setInterval(() => {
      updateTimerDisplay();
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const loadActiveTimer = async () => {
    try {
      const response = await fetch('/api/timer/active');
      const data = await response.json();
      
      if (data.active || data.currentTime > 0) {
        setMode(data.mode || 'pomodoro');
        setDisplayTime(data.currentTime || 0);
        setTimerStatus({
          isRunning: data.active || false,
          pomodoroState: data.pomodoroState || 'study',
          sessionCount: data.sessionCount || 0
        });
      } else {
        // No active timer - set initial display based on mode
        if (mode === 'stopwatch') {
          setDisplayTime(0);
        }
      }
    } catch (error) {
      console.error('Failed to load active timer:', error);
    }
  };

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    if (mode === 'pomodoro' || mode === 'stopwatch') {
      // No longer needed - server handles state
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

  // Server-side timer state management
  const updateTimerDisplay = async () => {
    try {
      const response = await fetch('/api/timer/active');
      const data = await response.json();
      
      if (data.active || data.currentTime > 0) {
        setDisplayTime(data.currentTime || 0);
        setTimerStatus({
          isRunning: data.active || false,
          pomodoroState: data.pomodoroState || 'study',
          sessionCount: data.sessionCount || 0
        });
        
        // Check if pomodoro completed
        if (data.completed && data.mode === 'pomodoro') {
          handlePomodoroComplete();
        }
      } else if (!timerStatus.isRunning) {
        // Timer is not active, set to default
        if (mode === 'pomodoro') {
          setDisplayTime(pomodoroSettings.studyTime * 60);
        }
      }
    } catch (error) {
      console.error('Failed to update timer:', error);
    }
  };

  const handlePomodoroComplete = async () => {
    // Notification
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Udo Timer', {
        body: timerStatus.pomodoroState === 'study' ? 'Time for a break!' : 'Time to study!',
        icon: '/favicon.ico'
      });
    }
    
    // Auto-transition handled by server
    await updateTimerDisplay();
  };

  const startTimer = async () => {
    try {
      const initialTime = mode === 'pomodoro' 
        ? pomodoroSettings.studyTime * 60 
        : 0;
      
      const response = await fetch('/api/timer/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: mode,
          initialTime: initialTime,
          pomodoroState: timerStatus.pomodoroState || 'study',
          sessionCount: timerStatus.sessionCount || 0
        })
      });
      
      if (response.ok) {
        setTimerStatus({ ...timerStatus, isRunning: true });
        await updateTimerDisplay();
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const pauseTimer = async () => {
    try {
      const response = await fetch('/api/timer/active', {
        method: 'PUT'
      });
      
      if (response.ok) {
        setTimerStatus({ ...timerStatus, isRunning: false });
        await updateTimerDisplay();
      }
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const endSession = async () => {
    try {
      // Get current timer state
      const response = await fetch('/api/timer/active');
      const data = await response.json();
      
      if (!data.startTime) return;

      let duration = 0;
      if (mode === 'pomodoro') {
        const initialTime = pomodoroSettings.studyTime * 60;
        duration = initialTime - (data.currentTime || initialTime);
      } else {
        duration = data.currentTime || 0;
      }

      if (duration > 0) {
        await saveSession({
          type: mode,
          mode: mode === 'pomodoro' ? data.pomodoroState : undefined,
          startTime: data.startTime,
          endTime: new Date().toISOString(),
          duration: duration
        });
      }

      // Delete active timer on server
      await fetch('/api/timer/active', { method: 'DELETE' });

      // Reset display
      if (mode === 'pomodoro') {
        setDisplayTime(pomodoroSettings.studyTime * 60);
        setTimerStatus({ isRunning: false, pomodoroState: 'study', sessionCount: 0 });
      } else {
        setDisplayTime(0);
        setTimerStatus({ isRunning: false, pomodoroState: 'study', sessionCount: 0 });
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  const changeMode = async (newMode) => {
    if (timerStatus.isRunning) {
      await pauseTimer();
    }
    
    // Delete any active timer
    try {
      await fetch('/api/timer/active', { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to clear timer:', error);
    }
    
    setMode(newMode);
    
    // Set display time immediately based on new mode
    if (newMode === 'pomodoro') {
      setDisplayTime(pomodoroSettings.studyTime * 60);
      setTimerStatus({ isRunning: false, pomodoroState: 'study', sessionCount: 0 });
    } else {
      setDisplayTime(0);
      setTimerStatus({ isRunning: false, pomodoroState: 'study', sessionCount: 0 });
    }
  };

  // Get current display time
  const getDisplayTime = () => {
    return displayTime;
  };

  const getTimerStatus = () => {
    return timerStatus;
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

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString([], { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const timeObj = formatTime(displayTime);
  const status = timerStatus;

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
                    <div key={session.id} className="border border-border rounded-lg overflow-hidden">
                      {/* Session Header */}
                      <div 
                        onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                        className="flex items-center justify-between p-3 bg-secondary hover:bg-secondary/80 cursor-pointer transition-colors"
                      >
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
                        <div className="flex items-center gap-2">
                          {expandedSession === session.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {expandedSession === session.id && (
                        <div className="p-4 bg-card border-t border-border space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Type:</span>
                              <p className="font-medium">{session.type === 'pomodoro' ? 'Pomodoro' : 'Stopwatch'}</p>
                            </div>
                            {session.mode && (
                              <div>
                                <span className="text-muted-foreground">Mode:</span>
                                <p className="font-medium capitalize">{session.mode}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-muted-foreground">Duration:</span>
                              <p className="font-medium">{formatDuration(session.duration)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duration (min):</span>
                              <p className="font-medium">{Math.round(session.duration / 60)} minutes</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Started:</span>
                              <p className="font-medium text-xs">{formatDateTime(session.startTime)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Ended:</span>
                              <p className="font-medium text-xs">{formatDateTime(session.endTime)}</p>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-border">
                            <span className="text-muted-foreground text-sm">Session ID:</span>
                            <p className="text-xs font-mono">{session.id}</p>
                          </div>
                        </div>
                      )}
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
