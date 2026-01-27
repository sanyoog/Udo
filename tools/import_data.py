"""Import a board-style data.json into Udo page format.
Reads /workspaces/Udo/data.json and writes a page JSON to backend/userdata/pages/
"""
import json
import os
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / 'data.json'
PAGES_DIR = ROOT / 'backend' / 'userdata' / 'pages'

STATUS_MAP = {
    'todo': 'todo',
    'inprogress': 'in-progress',
    'in-progress': 'in-progress',
    'done': 'completed',
    'completed': 'completed',
    'overdue': 'overdue'
}


def date_to_simple(iso_ts: str) -> str:
    # Convert ISO datetime to YYYY-MM-DD
    if not iso_ts:
        return ''
    if 'T' in iso_ts:
        return iso_ts.split('T')[0]
    return iso_ts


def load_and_convert():
    if not DATA_FILE.exists():
        print(f"Data file not found: {DATA_FILE}")
        sys.exit(1)

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    page_meta = data.get('page', {})
    page_id = page_meta.get('id') or f"imported-{int(datetime.utcnow().timestamp())}"
    page_name = page_meta.get('name') or page_id

    tasks = []

    for col in data.get('columns', []):
        col_id = col.get('id', '').lower()
        mapped_status = STATUS_MAP.get(col_id, col_id)
        for t in col.get('tasks', []):
            task = {}
            task['id'] = t.get('id') or f"task-{int(datetime.utcnow().timestamp())}"
            task['title'] = t.get('title', '')
            task['description'] = t.get('description', '')
            # Keep tags as-is
            task['tags'] = t.get('tags', [])
            # Timestamp: convert to YYYY-MM-DD
            ts = t.get('timestamp', '')
            simple = date_to_simple(ts)
            task['timestamp'] = simple
            # If duration_days in meta, create range end date
            meta = t.get('meta', {}) or {}
            duration_days = meta.get('duration_days')
            if duration_days and simple:
                try:
                    start = datetime.strptime(simple, '%Y-%m-%d')
                    end = start + timedelta(days=int(duration_days) - 1)
                    task['timestamp'] = f"{simple}:{end.strftime('%Y-%m-%d')}"
                except Exception:
                    # ignore and keep single date
                    pass
            # status mapping
            task['status'] = mapped_status
            # copy priority/meta if present
            if 'priority' in t:
                task['priority'] = t['priority']
            if meta:
                task['meta'] = meta

            tasks.append(task)

    page_data = {
        'id': page_id,
        'name': page_name,
        'tasks': tasks
    }

    # Ensure pages dir exists
    PAGES_DIR.mkdir(parents=True, exist_ok=True)

    out_file = PAGES_DIR / f"{page_id}.json"
    # if exists, append timestamp to filename
    if out_file.exists():
        out_file = PAGES_DIR / f"{page_id}-{int(datetime.utcnow().timestamp())}.json"

    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(page_data, f, indent=2, ensure_ascii=False)

    print(f"Imported page written to: {out_file}")


if __name__ == '__main__':
    from datetime import timedelta
    load_and_convert()
