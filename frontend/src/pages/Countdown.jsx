import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Topbar } from '../components/Topbar';

const Countdown = () => {
  const [events, setEvents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showPast, setShowPast] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetDate: '',
    description: '',
    color: '#3B82F6'
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prevTimes, setPrevTimes] = useState({});

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update prevTimes for animation
    const newPrevTimes = {};
    events.forEach(event => {
      const target = new Date(event.targetDate);
      const diff = target - currentTime;
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        newPrevTimes[event.id] = { days, hours, minutes, seconds };
      }
    });
    setPrevTimes(newPrevTimes);
  }, [currentTime, events]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, formData);
        setEditingEvent(null);
      } else {
        await createEvent(formData);
      }
      setFormData({ name: '', targetDate: '', description: '', color: '#3B82F6' });
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to submit event:', error);
      alert('Failed to save event. Please try again.');
    }
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

  const calculateTimeLeft = (targetDate, eventId) => {
    try {
      const target = new Date(targetDate);
      const diff = target - currentTime;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Track changes for animation
      const prev = prevTimes[eventId] || {};
      const changed = {
        days: prev.days !== days,
        hours: prev.hours !== hours,
        minutes: prev.minutes !== minutes,
        seconds: prev.seconds !== seconds
      };

      // setPrevTimes(p => ({ ...p, [eventId]: { days, hours, minutes, seconds } })); // Removed to prevent infinite loop

      return { days, hours, minutes, seconds, isPast: false, changed };
    } catch (error) {
      console.error('Error calculating time:', error);
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false, changed: {} };
    }
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

  const upcomingEvents = events.filter(e => new Date(e.targetDate) > currentTime);
  const pastEvents = events.filter(e => new Date(e.targetDate) <= currentTime);

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Event Countdown" />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Add Event Button */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditingEvent(null);
                setFormData({ name: '', targetDate: '', description: '', color: '#3B82F6' });
                setShowAddModal(true);
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>

          {/* Upcoming Events */}
          {upcomingEvents.length === 0 ? (
            <div className="card p-20 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-medium mb-2">No upcoming events</h2>
              <p className="text-muted-foreground mb-6">
                Create your first countdown event to track important dates
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                Create Event
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => {
                const timeLeft = calculateTimeLeft(event.targetDate, event.id);
                return (
                  <div
                    key={event.id}
                    className="card p-6"
                    style={{
                      borderTopColor: event.color,
                      borderTopWidth: '3px'
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold flex-1 pr-2">{event.name}</h3>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-1.5 hover:bg-gray-100 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                    )}

                    {/* Countdown Display */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold font-mono">
                          {timeLeft.days}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold font-mono">
                          {timeLeft.hours.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Hours</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold font-mono">
                          {timeLeft.minutes.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Mins</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold font-mono">
                          {timeLeft.seconds.toString().padStart(2, '0')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Secs</div>
                      </div>
                    </div>

                    {/* Target Date */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground border-t pt-3">
                      <Clock className="w-4 h-4" />
                      {formatDate(event.targetDate)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <div className="card p-6">
              <button
                onClick={() => setShowPast(!showPast)}
                className="flex items-center justify-between w-full"
              >
                <h3 className="font-semibold">Past Events ({pastEvents.length})</h3>
                {showPast ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showPast && (
                <div className="mt-4 space-y-2">
                  {pastEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                          <span className="font-medium">{event.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(event.targetDate)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="p-2 hover:bg-red-50 rounded text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add/Edit Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">
                    {editingEvent ? 'Edit Event' : 'Add New Event'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingEvent(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                      required
                      placeholder="e.g., JEE Mains Exam"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Target Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      className="input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description (optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="textarea"
                      rows="3"
                      placeholder="Add any additional details..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Color Theme</label>
                    <div className="grid grid-cols-6 gap-2">
                      {colorOptions.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className="w-10 h-10 rounded-lg border-2 border-gray-300"
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
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                      {editingEvent ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Countdown;
