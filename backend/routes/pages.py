"""
Page routes for Udo API
"""

from flask import Blueprint, jsonify, request
from backend.file_manager import (
    get_all_pages, get_page, create_page, delete_page,
    import_page_from_json, update_overdue_tasks, sync_tags_from_page,
    update_page_name
)

pages_bp = Blueprint('pages', __name__)


@pages_bp.route('/pages', methods=['GET'])
def list_pages():
    """Get list of all pages"""
    update_overdue_tasks()  # Update overdue tasks before returning data
    pages = get_all_pages()
    return jsonify({"success": True, "pages": pages})


@pages_bp.route('/page/<page_id>', methods=['GET'])
def get_page_by_id(page_id):
    """Get a specific page by ID"""
    update_overdue_tasks()
    page = get_page(page_id)
    
    if page:
        return jsonify({"success": True, "page": page})
    return jsonify({"success": False, "error": "Page not found"}), 404


@pages_bp.route('/page/create', methods=['POST'])
def create_new_page():
    """Create a new page"""
    data = request.json
    
    if not data or "name" not in data:
        return jsonify({"success": False, "error": "Page name is required"}), 400
    
    page = create_page(data["name"])
    
    if page:
        return jsonify({"success": True, "page": page}), 201
    return jsonify({"success": False, "error": "Failed to create page"}), 500


@pages_bp.route('/page/import', methods=['POST'])
def import_page():
    """Import a page from JSON data"""
    data = request.json
    
    if not data:
        return jsonify({"success": False, "error": "No data provided"}), 400
    
    page = import_page_from_json(data)
    
    if page:
        return jsonify({"success": True, "page": page}), 201
    return jsonify({"success": False, "error": "Failed to import page"}), 500


@pages_bp.route('/page/<page_id>', methods=['DELETE'])
def delete_page_by_id(page_id):
    """Delete a page"""
    if delete_page(page_id):
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Failed to delete page"}), 500


@pages_bp.route('/page/<page_id>/sync_tags', methods=['POST'])
def sync_page_tags(page_id):
    """Sync tags from a page to maindata"""
    result = sync_tags_from_page(page_id)
    
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 404


@pages_bp.route('/page/<page_id>/update_name', methods=['PUT'])
def update_page_name_route(page_id):
    """Update a page's name"""
    data = request.json
    
    if not data or 'name' not in data:
        return jsonify({"success": False, "error": "Name is required"}), 400
    
    result = update_page_name(page_id, data['name'])
    
    if result['success']:
        return jsonify(result), 200
    return jsonify(result), 404
