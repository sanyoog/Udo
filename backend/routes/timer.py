from flask import Blueprint, jsonify, request
from datetime import datetime
import json
import os

timer_bp = Blueprint('timer', __name__)

TIMER_DATA_PATH = 'backend/userdata/timer_sessions.json'
TIMER_SETTINGS_PATH = 'backend/userdata/timer_settings.json'

def ensure_timer_files():
    """Ensure timer data files exist"""
    os.makedirs(os.path.dirname(TIMER_DATA_PATH), exist_ok=True)
    
    if not os.path.exists(TIMER_DATA_PATH):
        with open(TIMER_DATA_PATH, 'w') as f:
            json.dump({'sessions': []}, f)
    
    if not os.path.exists(TIMER_SETTINGS_PATH):
        default_settings = {
            'pomodoro': {
                'studyTime': 25,  # minutes
                'breakTime': 5,
                'longBreakTime': 15,
                'sessionsBeforeLongBreak': 4
            }
        }
        with open(TIMER_SETTINGS_PATH, 'w') as f:
            json.dump(default_settings, f)

def get_timer_data():
    """Load timer sessions data"""
    ensure_timer_files()
    with open(TIMER_DATA_PATH, 'r') as f:
        return json.load(f)

def save_timer_data(data):
    """Save timer sessions data"""
    ensure_timer_files()
    with open(TIMER_DATA_PATH, 'w') as f:
        json.dump(data, f, indent=2)

def get_timer_settings():
    """Load timer settings"""
    ensure_timer_files()
    with open(TIMER_SETTINGS_PATH, 'r') as f:
        return json.load(f)

def save_timer_settings(settings):
    """Save timer settings"""
    ensure_timer_files()
    with open(TIMER_SETTINGS_PATH, 'w') as f:
        json.dump(settings, f, indent=2)

@timer_bp.route('/api/timer/sessions', methods=['GET'])
def get_sessions():
    """Get all timer sessions"""
    try:
        data = get_timer_data()
        return jsonify(data['sessions'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@timer_bp.route('/api/timer/sessions', methods=['POST'])
def create_session():
    """Create a new timer session"""
    try:
        session_data = request.json
        data = get_timer_data()
        
        # Generate ID
        session_id = str(len(data['sessions']) + 1)
        session_data['id'] = session_id
        session_data['createdAt'] = datetime.now().isoformat()
        
        data['sessions'].append(session_data)
        save_timer_data(data)
        
        return jsonify(session_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@timer_bp.route('/api/timer/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a timer session"""
    try:
        data = get_timer_data()
        data['sessions'] = [s for s in data['sessions'] if s['id'] != session_id]
        save_timer_data(data)
        return jsonify({'message': 'Session deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@timer_bp.route('/api/timer/settings', methods=['GET'])
def get_settings():
    """Get timer settings"""
    try:
        settings = get_timer_settings()
        return jsonify(settings)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@timer_bp.route('/api/timer/settings', methods=['PUT'])
def update_settings():
    """Update timer settings"""
    try:
        new_settings = request.json
        save_timer_settings(new_settings)
        return jsonify(new_settings), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@timer_bp.route('/api/timer/stats', methods=['GET'])
def get_stats():
    """Get timer statistics for dashboard"""
    try:
        data = get_timer_data()
        sessions = data['sessions']
        
        # Calculate stats
        total_sessions = len(sessions)
        total_time = sum(s.get('duration', 0) for s in sessions)  # in seconds
        
        # Group by date
        sessions_by_date = {}
        for session in sessions:
            date = session.get('startTime', '')[:10]  # Extract date
            if date not in sessions_by_date:
                sessions_by_date[date] = {'count': 0, 'duration': 0}
            sessions_by_date[date]['count'] += 1
            sessions_by_date[date]['duration'] += session.get('duration', 0)
        
        # Recent sessions (last 7 days)
        recent_sessions = sorted(sessions, key=lambda s: s.get('startTime', ''), reverse=True)[:10]
        
        return jsonify({
            'totalSessions': total_sessions,
            'totalTime': total_time,
            'sessionsByDate': sessions_by_date,
            'recentSessions': recent_sessions
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
