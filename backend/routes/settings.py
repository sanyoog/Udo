"""
Settings routes for Udo API
"""

from flask import Blueprint, jsonify, request
from backend.file_manager import get_maindata, save_maindata, update_tag

settings_bp = Blueprint('settings', __name__)


@settings_bp.route('/settings', methods=['GET'])
def get_settings():
    """Get application settings"""
    settings = get_maindata()
    return jsonify({"success": True, "settings": settings})


@settings_bp.route('/settings/update', methods=['PUT'])
def update_settings():
    """Update application settings"""
    data = request.json
    
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
    
    current_settings = get_maindata()
    current_settings.update(data)
    
    if save_maindata(current_settings):
        return jsonify({"success": True, "settings": current_settings})
    return jsonify({"success": False, "error": "Failed to update settings"}), 500


@settings_bp.route('/settings/tag/<tag_id>', methods=['PUT'])
def update_tag_route(tag_id):
    """Update a specific tag"""
    data = request.json
    
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
    
    result = update_tag(tag_id, data)
    
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 404
