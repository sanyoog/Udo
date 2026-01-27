import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Calendar, Clock } from 'lucide-react';

const Countdown = () => {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetDate: '',
    description: '',
    color: '#3B82F6'
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchEvents();
    // Update current time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/countdown/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const createEvent = async (eventData) => {
    try {
      await fetch('/api/countdown/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      fetchEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const updateEvent = async (eventId, eventData) => {
    try {
      await fetch(`/api/countdown/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      fetchEvents();
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      await fetch(`/api/countdown/events/${eventId}`, {
        method: 'DELETE'
      });
      fetchEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEvent) {
      updateEvent(editingEvent.id, formData);
      setEditingEvent(null);
    } else {
      createEvent(formData);
    }
    setFormData({ name: '', targetDate: '', description: '', color: '#3B82F6' });
    setShowAddModal(false);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      targetDate: event.targetDate,
      description: event.description || '',
      color: event.color || '#3B82F6'
    });
    setShowAddModal(true);
  };

  const calculateTimeLeft = (targetDate) => {
    const target = new Date(targetDate);
    const diff = target - currentTime;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isPast: false };
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Orange' },
    { value: '#EF4444', label: 'Red' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#EC4899', label: 'Pink' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Event Countdown</h1>
          <button
            onClick={() => {
              setEditingEvent(null);
              setFormData({ name: '', targetDate: '', description: '', color: '#3B82F6' });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Event
          </button>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-20 animate-fade-in-up">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
              No events yet
            </h2>
            <p className="text-gray-500 dark:text-gray-500 mb-6">
              Create your first countdown event to get started
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => {
              const timeLeft = calculateTimeLeft(event.targetDate);
              return (
                <div
                  key={event.id}
                  className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-800 animate-fade-in-up"
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    borderTopColor: event.color,
                    borderTopWidth: '4px'
                  }}
                >
                  {/* Event Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                      {event.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(event)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {event.description}
                    </p>
                  )}

                  {/* Countdown Display */}
                  {timeLeft.isPast ? (
                    <div className="text-center py-8">
                      <p className="text-2xl font-bold text-gray-400 dark:text-gray-600">
                        Event Passed
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center countdown-unit">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                          {timeLeft.days}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Days
                        </div>
                      </div>
                      <div className="text-center countdown-unit">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                          {timeLeft.hours.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Hours
                        </div>
                      </div>
                      <div className="text-center countdown-unit">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                          {timeLeft.minutes.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Mins
                        </div>
                      </div>
                      <div className="text-center countdown-unit">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white font-mono">
                          {timeLeft.seconds.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Secs
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Target Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-3">
                    <Clock className="w-4 h-4" />
                    {formatDate(event.targetDate)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6 animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingEvent ? 'Edit Event' : 'Add New Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingEvent(null);
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                    placeholder="e.g., JEE Mains Exam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Target Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    rows="3"
                    placeholder="Add any additional details..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Color Theme
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          formData.color === color.value
                            ? 'border-gray-900 dark:border-white scale-110'
                            : 'border-gray-300 dark:border-gray-700'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingEvent(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingEvent ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Countdown;
