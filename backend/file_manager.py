"""
File Manager for Udo
Handles all file system operations for local JSON storage
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any
import uuid

USERDATA_DIR = os.path.join(os.path.dirname(__file__), 'userdata')
PAGES_DIR = os.path.join(USERDATA_DIR, 'pages')
MAINDATA_FILE = os.path.join(USERDATA_DIR, 'maindata.json')


def ensure_directories():
    """Ensure all required directories exist"""
    os.makedirs(PAGES_DIR, exist_ok=True)


def get_maindata() -> Dict[str, Any]:
    """Load main application data"""
    if not os.path.exists(MAINDATA_FILE):
        default_data = {
            "theme": "light",
            "sidebar_collapsed": False,
            "tags": [
                {"id": "urgent", "name": "Urgent", "color": "#000000"},
                {"id": "important", "name": "Important", "color": "#404040"},
                {"id": "low-priority", "name": "Low Priority", "color": "#808080"}
            ]
        }
        save_maindata(default_data)
        return default_data
    
    with open(MAINDATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_maindata(data: Dict[str, Any]) -> bool:
    """Save main application data"""
    try:
        with open(MAINDATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving maindata: {e}")
        return False


def get_all_pages() -> List[Dict[str, Any]]:
    """Get list of all pages (metadata only)"""
    pages = []
    
    if not os.path.exists(PAGES_DIR):
        return pages
    
    for filename in os.listdir(PAGES_DIR):
        if filename.endswith('.json'):
            page_id = filename[:-5]  # Remove .json extension
            page_data = get_page(page_id)
            if page_data:
                pages.append({
                    "id": page_data.get("id"),
                    "name": page_data.get("name"),
                    "task_count": len(page_data.get("tasks", []))
                })
    
    return pages


def get_page(page_id: str) -> Dict[str, Any]:
    """Load a specific page"""
    page_file = os.path.join(PAGES_DIR, f"{page_id}.json")
    
    if not os.path.exists(page_file):
        return None
    
    with open(page_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_page(page_id: str, data: Dict[str, Any]) -> bool:
    """Save page data"""
    try:
        page_file = os.path.join(PAGES_DIR, f"{page_id}.json")
        with open(page_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving page {page_id}: {e}")
        return False


def create_page(name: str) -> Dict[str, Any]:
    """Create a new empty page"""
    page_id = str(uuid.uuid4())
    page_data = {
        "id": page_id,
        "name": name,
        "tasks": []
    }
    
    if save_page(page_id, page_data):
        return page_data
    return None


def delete_page(page_id: str) -> bool:
    """Delete a page"""
    try:
        page_file = os.path.join(PAGES_DIR, f"{page_id}.json")
        if os.path.exists(page_file):
            os.remove(page_file)
            return True
        return False
    except Exception as e:
        print(f"Error deleting page {page_id}: {e}")
        return False


def create_task(page_id: str, task_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new task in a page"""
    page = get_page(page_id)
    if not page:
        return None
    
    task = {
        "id": str(uuid.uuid4()),
        "title": task_data.get("title", ""),
        "description": task_data.get("description", ""),
        "tags": task_data.get("tags", []),
        "timestamp": task_data.get("timestamp", datetime.now().strftime("%Y-%m-%d")),
        "status": task_data.get("status", "todo")
    }
    
    page["tasks"].append(task)
    
    if save_page(page_id, page):
        return task
    return None


def update_task(page_id: str, task_id: str, updates: Dict[str, Any]) -> bool:
    """Update an existing task"""
    page = get_page(page_id)
    if not page:
        return False
    
    for i, task in enumerate(page["tasks"]):
        if task["id"] == task_id:
            page["tasks"][i].update(updates)
            return save_page(page_id, page)
    
    return False


def delete_task(page_id: str, task_id: str) -> bool:
    """Delete a task from a page"""
    page = get_page(page_id)
    if not page:
        return False
    
    page["tasks"] = [task for task in page["tasks"] if task["id"] != task_id]
    return save_page(page_id, page)


def get_all_tasks() -> List[Dict[str, Any]]:
    """Get all tasks from all pages"""
    all_tasks = []
    
    for filename in os.listdir(PAGES_DIR):
        if filename.endswith('.json'):
            page_id = filename[:-5]
            page_data = get_page(page_id)
            if page_data and "tasks" in page_data:
                for task in page_data["tasks"]:
                    task_copy = task.copy()
                    task_copy["page_id"] = page_id
                    task_copy["page_name"] = page_data.get("name", "Unknown")
                    all_tasks.append(task_copy)
    
    return all_tasks


def import_page_from_json(data: Dict[str, Any]) -> Dict[str, Any]:
    """Import a page from JSON data"""
    # Validate structure
    if "name" not in data:
        return None
    
    # Generate new ID if not present or if ID already exists
    page_id = data.get("id", str(uuid.uuid4()))
    if get_page(page_id):
        page_id = str(uuid.uuid4())
    
    page_data = {
        "id": page_id,
        "name": data["name"],
        "tasks": data.get("tasks", [])
    }
    
    # Ensure all tasks have IDs
    for task in page_data["tasks"]:
        if "id" not in task:
            task["id"] = str(uuid.uuid4())
    
    if save_page(page_id, page_data):
        return page_data
    return None


def update_overdue_tasks():
    """Automatically update task statuses based on timestamps"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    for filename in os.listdir(PAGES_DIR):
        if filename.endswith('.json'):
            page_id = filename[:-5]
            page_data = get_page(page_id)
            
            if page_data and "tasks" in page_data:
                updated = False
                for task in page_data["tasks"]:
                    # Parse end date from timestamp
                    end_date = task.get("timestamp", "")
                    
                    # Handle date ranges: "2026-01-20:2026-01-30" or "2026-01-20-2026-01-30"
                    if ':' in end_date:
                        end_date = end_date.split(':')[1]
                    elif '-' in end_date and len(end_date) > 10:
                        # Check if it's a range like "2026-01-20-2026-01-30"
                        parts = end_date.split('-')
                        if len(parts) == 6:
                            end_date = f"{parts[3]}-{parts[4]}-{parts[5]}"
                    
                    # If task has an end date and it's in the past, and not completed, mark as overdue
                    if (end_date and 
                        end_date < today and 
                        task.get("status") not in ["completed", "overdue"]):
                        task["status"] = "overdue"
                        updated = True
                
                if updated:
                    save_page(page_id, page_data)


def sync_tags_from_page(page_id: str) -> Dict[str, Any]:
    """Extract unique tags from a page and add them to maindata if not present"""
    page = get_page(page_id)
    if not page:
        return {'success': False, 'error': 'Page not found'}
    
    maindata = get_maindata()
    existing_tags = {tag['id']: tag for tag in maindata.get('tags', [])}
    
    # Extract unique tags from all tasks in the page
    page_tags = set()
    for task in page.get('tasks', []):
        page_tags.update(task.get('tags', []))
    
    # Add new tags to maindata
    new_tags_added = []
    for tag_name in page_tags:
        tag_id = tag_name.lower().replace(' ', '-')
        if tag_id not in existing_tags:
            new_tag = {
                'id': tag_id,
                'name': tag_name,
                'color': '#808080'  # Default gray
            }
            existing_tags[tag_id] = new_tag
            new_tags_added.append(new_tag)
    
    if new_tags_added:
        maindata['tags'] = list(existing_tags.values())
        save_maindata(maindata)
    
    return {
        'success': True,
        'tags_added': new_tags_added,
        'total_tags': len(existing_tags)
    }


def update_page_name(page_id: str, new_name: str) -> Dict[str, Any]:
    """Update a page's name"""
    page = get_page(page_id)
    if not page:
        return {'success': False, 'error': 'Page not found'}
    
    page['name'] = new_name
    save_page(page_id, page)
    
    # Update in maindata
    maindata = get_maindata()
    for p in maindata.get('pages', []):
        if p['id'] == page_id:
            p['name'] = new_name
            break
    save_maindata(maindata)
    
    return {'success': True, 'page': page}


def update_tag(tag_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update a tag's properties (name, color)"""
    maindata = get_maindata()
    tags = maindata.get('tags', [])
    
    tag_found = False
    for tag in tags:
        if tag['id'] == tag_id:
            if 'name' in updates:
                tag['name'] = updates['name']
            if 'color' in updates:
                tag['color'] = updates['color']
            tag_found = True
            break
    
    if not tag_found:
        return {'success': False, 'error': 'Tag not found'}
    
    maindata['tags'] = tags
    save_maindata(maindata)
    
    return {'success': True, 'tags': tags}
