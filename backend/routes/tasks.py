"""
Task routes for Udo API
"""

from flask import Blueprint, jsonify, request
from backend.file_manager import (
    create_task, update_task, delete_task, get_all_tasks
)

tasks_bp = Blueprint('tasks', __name__)


@tasks_bp.route('/tasks', methods=['GET'])
def list_all_tasks():
    """Get all tasks from all pages"""
    tasks = get_all_tasks()
    return jsonify({"success": True, "tasks": tasks})


@tasks_bp.route('/task/create', methods=['POST'])
def create_new_task():
    """Create a new task in a page"""
    data = request.json
    
    if not data or "page_id" not in data:
        return jsonify({"success": False, "error": "page_id is required"}), 400
    
    page_id = data.pop("page_id")
    task = create_task(page_id, data)
    
    if task:
        return jsonify({"success": True, "task": task}), 201
    return jsonify({"success": False, "error": "Failed to create task"}), 500


@tasks_bp.route('/task/update', methods=['PUT'])
def update_existing_task():
    """Update an existing task"""
    data = request.json
    
    if not data or "page_id" not in data or "task_id" not in data:
        return jsonify({"success": False, "error": "page_id and task_id are required"}), 400
    
    page_id = data.pop("page_id")
    task_id = data.pop("task_id")
    
    if update_task(page_id, task_id, data):
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Failed to update task"}), 500


@tasks_bp.route('/task/delete', methods=['DELETE'])
def delete_existing_task():
    """Delete a task"""
    data = request.json
    
    if not data or "page_id" not in data or "task_id" not in data:
        return jsonify({"success": False, "error": "page_id and task_id are required"}), 400
    
    if delete_task(data["page_id"], data["task_id"]):
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Failed to delete task"}), 500
