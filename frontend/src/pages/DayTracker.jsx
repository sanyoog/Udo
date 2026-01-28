import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Topbar } from '../components/Topbar';

const DayTracker = ({ theme, onThemeToggle }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [trackedDates, setTrackedDates] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    subject: '',
    chapter: '',
    task: '',
    description: ''
  });

  useEffect(() => {
    loadTrackedDates();
    loadDayData(formatDate(selectedDate));
    loadDayStats(formatDate(selectedDate));
  }, [selectedDate]);

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const loadTrackedDates = async () => {
    try {
      const response = await fetch('/api/daytracker/dates');
      const data = await response.json();
      setTrackedDates(data.dates || []);
    } catch (error) {
      console.error('Failed to load tracked dates:', error);
    }
  };

  const loadDayData = async (dateStr) => {
    try {
      const response = await fetch(`/api/daytracker/day/${dateStr}`);
      const data = await response.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Failed to load day data:', error);
    }
  };

  const loadDayStats = async (dateStr) => {
    try {
      const response = await fetch(`/api/daytracker/stats/${dateStr}`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dateStr = formatDate(selectedDate);
    const entryData = {
      ...formData,
      date: dateStr,
      startTime: `${dateStr}T${formData.startTime}:00`,
      endTime: `${dateStr}T${formData.endTime}:00`
    };

    try {
      if (editingEntry) {
        // Update existing entry
        await fetch(`/api/daytracker/entry/${dateStr}/${editingEntry.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData)
        });
      } else {
        // Create new entry
        await fetch('/api/daytracker/entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData)
        });
      }
      
      // Reload data
      loadDayData(dateStr);
      loadDayStats(dateStr);
      loadTrackedDates();
      
      // Reset form
      setFormData({ startTime: '', endTime: '', subject: '', chapter: '', task: '', description: '' });
      setShowAddForm(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const handleEdit = (entry) => {
    const startTime = new Date(entry.startTime).toTimeString().slice(0, 5);
    const endTime = new Date(entry.endTime).toTimeString().slice(0, 5);
    
    setFormData({
      startTime,
      endTime,
      subject: entry.subject || '',
      chapter: entry.chapter || '',
      task: entry.task || '',
      description: entry.description || ''
    });
    setEditingEntry(entry);
    setShowAddForm(true);
  };

  const handleDelete = async (entryId) => {
    const dateStr = formatDate(selectedDate);
    try {
      await fetch(`/api/daytracker/entry/${dateStr}/${entryId}`, { method: 'DELETE' });
      loadDayData(dateStr);
      loadDayStats(dateStr);
      loadTrackedDates();
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date) => {
    if (!date) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const hasTrackedData = (date) => {
    if (!date) return false;
    return trackedDates.includes(formatDate(date));
  };

  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start, end) => {
    const duration = (new Date(end) - new Date(start)) / 1000 / 60; // minutes
    const hours = Math.floor(duration / 60);
    const mins = Math.floor(duration % 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 flex flex-col animate-fade-in">
      <Topbar title="Day Tracker" theme={theme} onThemeToggle={onThemeToggle} />
      
      <div className="flex-1 overflow-hidden mobile-padding md:p-6">
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Calendar Section */}
          <div className="col-span-1 lg:col-span-7 card p-4 md:p-6 overflow-y-auto animate-slide-down">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-semibold mobile-text">{monthName}</h2>
              <div className="flex gap-2">
                <button onClick={previousMonth} className="btn-ghost p-2">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={nextMonth} className="btn-ghost p-2">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
              
              {days.map((day, index) => (
                <div key={index}>
                  {day ? (
                    <button
                      onClick={() => setSelectedDate(day)}
                      className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative ${
                        isSelectedDate(day)
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : isToday(day)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                          : hasTrackedData(day)
                          ? 'bg-secondary hover:bg-secondary/80 font-medium'
                          : 'hover:bg-secondary'
                      }`}
                    >
                      {day.getDate()}
                      {hasTrackedData(day) && !isSelectedDate(day) && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></div>
                      )}
                    </button>
                  ) : (
                    <div className="w-full aspect-square"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Progress Section */}
          <div className="col-span-5 flex flex-col gap-4 overflow-y-auto">
            {/* Stats Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {isToday(selectedDate) ? "Today's Progress" : selectedDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
                <button 
                  onClick={() => {
                    setShowAddForm(!showAddForm);
                    setEditingEntry(null);
                    setFormData({ startTime: '', endTime: '', subject: '', chapter: '', task: '', description: '' });
                  }}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Entry
                </button>
              </div>
              
              {stats && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-2xl font-bold">{stats.totalHours}h</div>
                    <div className="text-xs text-muted-foreground">Total Time</div>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <div className="text-2xl font-bold">{stats.entryCount}</div>
                    <div className="text-xs text-muted-foreground">Entries</div>
                  </div>
                </div>
              )}
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
              <div className="card p-6">
                <h4 className="font-semibold mb-4">{editingEntry ? 'Edit Entry' : 'New Entry'}</h4>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm mb-1 text-muted-foreground">Start Time</label>
                      <input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1 text-muted-foreground">End Time</label>
                      <input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">Subject</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="input"
                      placeholder="e.g., Mathematics, Physics"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">Chapter/Topic</label>
                    <input
                      type="text"
                      value={formData.chapter}
                      onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                      className="input"
                      placeholder="e.g., Calculus, Mechanics"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">Task</label>
                    <input
                      type="text"
                      value={formData.task}
                      onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                      className="input"
                      placeholder="e.g., Practice problems, Reading"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1 text-muted-foreground">What did you do?</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="input min-h-20"
                      placeholder="Describe what you accomplished..."
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary flex-1">
                      {editingEntry ? 'Update' : 'Save'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingEntry(null);
                        setFormData({ startTime: '', endTime: '', subject: '', chapter: '', task: '', description: '' });
                      }}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Entries List */}
            <div className="card p-6 flex-1">
              <h4 className="font-semibold mb-4">Entries</h4>
              {entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No entries for this day</p>
                  <p className="text-xs mt-1">Click "Add Entry" to start tracking</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {entries.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).map((entry) => (
                    <div key={entry.id} className="border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({formatDuration(entry.startTime, entry.endTime)})
                            </span>
                          </div>
                          <div className="text-sm font-semibold">{entry.subject}</div>
                          {entry.chapter && (
                            <div className="text-xs text-muted-foreground">Chapter: {entry.chapter}</div>
                          )}
                          {entry.task && (
                            <div className="text-xs text-muted-foreground">Task: {entry.task}</div>
                          )}
                          {entry.description && (
                            <div className="text-sm mt-2 text-muted-foreground">{entry.description}</div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(entry)}
                            className="p-2 hover:bg-secondary rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayTracker;
