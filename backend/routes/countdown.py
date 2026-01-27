from flask import Blueprint, jsonify, request
from datetime import datetime
import json
import os

countdown_bp = Blueprint('countdown', __name__)

COUNTDOWN_DATA_PATH = 'backend/userdata/countdowns.json'

def ensure_countdown_file():
    """Ensure countdown data file exists"""
    os.makedirs(os.path.dirname(COUNTDOWN_DATA_PATH), exist_ok=True)
    
    if not os.path.exists(COUNTDOWN_DATA_PATH):
        with open(COUNTDOWN_DATA_PATH, 'w') as f:
            json.dump({'events': []}, f)

def get_countdown_data():
    """Load countdown data"""
    ensure_countdown_file()
    with open(COUNTDOWN_DATA_PATH, 'r') as f:
        return json.load(f)

def save_countdown_data(data):
    """Save countdown data"""
    ensure_countdown_file()
    with open(COUNTDOWN_DATA_PATH, 'w') as f:
        json.dump(data, f, indent=2)

@countdown_bp.route('/api/countdown/events', methods=['GET'])
def get_events():
    """Get all countdown events"""
    try:
        data = get_countdown_data()
        return jsonify(data['events'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@countdown_bp.route('/api/countdown/events', methods=['POST'])
def create_event():
    """Create a new countdown event"""
    try:
        event_data = request.json
        data = get_countdown_data()
        
        # Generate ID
        event_id = str(len(data['events']) + 1)
        event_data['id'] = event_id
        event_data['createdAt'] = datetime.now().isoformat()
        
        data['events'].append(event_data)
        save_countdown_data(data)
        
        return jsonify(event_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@countdown_bp.route('/api/countdown/events/<event_id>', methods=['PUT'])
def update_event(event_id):
    """Update a countdown event"""
    try:
        updated_event = request.json
        data = get_countdown_data()
        
        for i, event in enumerate(data['events']):
            if event['id'] == event_id:
                data['events'][i] = {**event, **updated_event, 'id': event_id}
                save_countdown_data(data)
                return jsonify(data['events'][i]), 200
        
        return jsonify({'error': 'Event not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@countdown_bp.route('/api/countdown/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Delete a countdown event"""
    try:
        data = get_countdown_data()
        data['events'] = [e for e in data['events'] if e['id'] != event_id]
        save_countdown_data(data)
        return jsonify({'message': 'Event deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@countdown_bp.route('/api/countdown/stats', methods=['GET'])
def get_stats():
    """Get countdown statistics for dashboard"""
    try:
        data = get_countdown_data()
        events = data['events']
        
        # Get upcoming events
        now = datetime.now()
        upcoming = []
        
        for event in events:
            target_time = datetime.fromisoformat(event['targetDate'])
            if target_time > now:
                upcoming.append({
                    **event,
                    'daysLeft': (target_time - now).days
                })
        
        # Sort by closest first
        upcoming.sort(key=lambda e: e['daysLeft'])
        
        return jsonify({
            'totalEvents': len(events),
            'upcomingEvents': upcoming[:5]  # Next 5 events
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
