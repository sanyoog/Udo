from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import json
import os
import glob

daytracker_bp = Blueprint('daytracker', __name__)

DAYTRACKER_DATA_DIR = 'backend/userdata/daytracker'

def ensure_daytracker_dir():
    """Ensure daytracker data directory exists"""
    os.makedirs(DAYTRACKER_DATA_DIR, exist_ok=True)

def get_day_file_path(date_str):
    """Get file path for a specific date (YYYY-MM-DD)"""
    ensure_daytracker_dir()
    return os.path.join(DAYTRACKER_DATA_DIR, f'day_{date_str}.json')

def get_day_data(date_str):
    """Load data for a specific day"""
    file_path = get_day_file_path(date_str)
    if not os.path.exists(file_path):
        return {'date': date_str, 'entries': []}
    
    with open(file_path, 'r') as f:
        return json.load(f)

def save_day_data(date_str, data):
    """Save data for a specific day"""
    file_path = get_day_file_path(date_str)
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)

def get_all_tracked_dates():
    """Get list of all dates that have tracking data"""
    ensure_daytracker_dir()
    files = glob.glob(os.path.join(DAYTRACKER_DATA_DIR, 'day_*.json'))
    dates = []
    for file_path in files:
        filename = os.path.basename(file_path)
        date_str = filename.replace('day_', '').replace('.json', '')
        dates.append(date_str)
    return sorted(dates)

@daytracker_bp.route('/api/daytracker/dates', methods=['GET'])
def get_tracked_dates():
    """Get all dates that have tracking data"""
    try:
        dates = get_all_tracked_dates()
        return jsonify({'dates': dates}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@daytracker_bp.route('/api/daytracker/day/<date_str>', methods=['GET'])
def get_day(date_str):
    """Get all entries for a specific day"""
    try:
        data = get_day_data(date_str)
        return jsonify(data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@daytracker_bp.route('/api/daytracker/entry', methods=['POST'])
def create_entry():
    """Create a new time entry"""
    try:
        entry_data = request.json
        date_str = entry_data.get('date')
        
        if not date_str:
            return jsonify({'error': 'Date is required'}), 400
        
        # Load day data
        day_data = get_day_data(date_str)
        
        # Generate entry ID
        entry_id = str(len(day_data['entries']) + 1)
        entry_data['id'] = entry_id
        entry_data['createdAt'] = datetime.now().isoformat()
        
        # Add entry
        day_data['entries'].append(entry_data)
        
        # Save
        save_day_data(date_str, day_data)
        
        return jsonify(entry_data), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@daytracker_bp.route('/api/daytracker/entry/<date_str>/<entry_id>', methods=['PUT'])
def update_entry(date_str, entry_id):
    """Update an existing entry"""
    try:
        updated_data = request.json
        day_data = get_day_data(date_str)
        
        # Find and update entry
        for i, entry in enumerate(day_data['entries']):
            if entry['id'] == entry_id:
                # Preserve id and createdAt
                updated_data['id'] = entry_id
                updated_data['createdAt'] = entry.get('createdAt')
                updated_data['updatedAt'] = datetime.now().isoformat()
                day_data['entries'][i] = updated_data
                break
        else:
            return jsonify({'error': 'Entry not found'}), 404
        
        save_day_data(date_str, day_data)
        return jsonify(updated_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@daytracker_bp.route('/api/daytracker/entry/<date_str>/<entry_id>', methods=['DELETE'])
def delete_entry(date_str, entry_id):
    """Delete an entry"""
    try:
        day_data = get_day_data(date_str)
        day_data['entries'] = [e for e in day_data['entries'] if e['id'] != entry_id]
        save_day_data(date_str, day_data)
        return jsonify({'message': 'Entry deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@daytracker_bp.route('/api/daytracker/stats/<date_str>', methods=['GET'])
def get_day_stats(date_str):
    """Get statistics for a specific day"""
    try:
        day_data = get_day_data(date_str)
        entries = day_data['entries']
        
        # Calculate total time
        total_minutes = 0
        subjects = {}
        
        for entry in entries:
            # Calculate duration
            if entry.get('startTime') and entry.get('endTime'):
                start = datetime.fromisoformat(entry['startTime'])
                end = datetime.fromisoformat(entry['endTime'])
                duration_minutes = (end - start).total_seconds() / 60
                total_minutes += duration_minutes
                
                # Track by subject
                subject = entry.get('subject', 'Other')
                if subject not in subjects:
                    subjects[subject] = 0
                subjects[subject] += duration_minutes
        
        return jsonify({
            'date': date_str,
            'totalMinutes': int(total_minutes),
            'totalHours': round(total_minutes / 60, 2),
            'entryCount': len(entries),
            'subjectBreakdown': subjects
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@daytracker_bp.route('/api/daytracker/stats/range', methods=['GET'])
def get_range_stats():
    """Get statistics for a date range"""
    try:
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        
        if not start_date or not end_date:
            return jsonify({'error': 'Start and end dates required'}), 400
        
        # Get all dates in range that have data
        all_dates = get_all_tracked_dates()
        range_dates = [d for d in all_dates if start_date <= d <= end_date]
        
        total_minutes = 0
        total_entries = 0
        all_subjects = {}
        
        for date_str in range_dates:
            day_data = get_day_data(date_str)
            for entry in day_data['entries']:
                total_entries += 1
                if entry.get('startTime') and entry.get('endTime'):
                    start = datetime.fromisoformat(entry['startTime'])
                    end = datetime.fromisoformat(entry['endTime'])
                    duration_minutes = (end - start).total_seconds() / 60
                    total_minutes += duration_minutes
                    
                    subject = entry.get('subject', 'Other')
                    if subject not in all_subjects:
                        all_subjects[subject] = 0
                    all_subjects[subject] += duration_minutes
        
        return jsonify({
            'startDate': start_date,
            'endDate': end_date,
            'totalMinutes': int(total_minutes),
            'totalHours': round(total_minutes / 60, 2),
            'totalEntries': total_entries,
            'trackedDays': len(range_dates),
            'subjectBreakdown': all_subjects
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
