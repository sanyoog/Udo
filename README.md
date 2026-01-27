# Udo

A minimal, local-first task management application with a Trello-style interface. Built for long daily usage with a clean monochrome design.

## Overview

Udo is a local-first web application that stores all data as JSON files on your filesystem. No authentication, no cloud sync, no database required.

### Features

- **Local-First**: All data stored as JSON files on your local machine
- **Trello-Style Boards**: Organize tasks in columns (To Do, In Progress, Completed, Overdue)
- **Dynamic Pages**: Create unlimited custom boards for different projects
- **Tag System**: Organize tasks with custom tags
- **Clean Design**: Monochrome, minimal interface inspired by Linear and Arc Browser
- **No Setup Required**: No database configuration, no authentication system

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router
- Lucide Icons
- Space Grotesk font

### Backend
- Flask (Python 3)
- File-based JSON storage
- REST API
- No database, no ORM

## Project Structure

```
udo/
├── start.py                    # Application launcher
├── backend/
│   ├── app.py                  # Flask application
│   ├── file_manager.py         # File operations handler
│   ├── requirements.txt        # Python dependencies
│   ├── routes/
│   │   ├── pages.py           # Page management endpoints
│   │   ├── tasks.py           # Task management endpoints
│   │   └── settings.py        # Settings endpoints
│   └── userdata/
│       ├── maindata.json      # Global settings and tags
│       └── pages/             # Individual page JSON files
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Main page components
│   │   ├── App.jsx           # Main app component
│   │   ├── main.jsx          # Entry point
│   │   ├── api.js            # API client
│   │   └── index.css         # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

## Installation & Setup

### Prerequisites

- **Python 3.8+** (required)
- **Node.js 16+** (optional, for frontend development)

### Quick Start

1. **Clone or download the project**

```bash
cd Udo
```

2. **Run the launcher**

```bash
python start.py
```

The launcher will:
- Check for Python dependencies and install if needed
- Check for Node.js
- Build the frontend if Node.js is available
- Start the Flask backend server

3. **Access the application**

Open your browser and navigate to:
```
http://localhost:5000
```

### Manual Setup

If you prefer manual setup:

#### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

#### Frontend Setup (optional)

```bash
cd frontend
npm install
npm run build
```

For development mode:
```bash
npm run dev
```

## Usage

### Main Pages

1. **Dashboard**: Overview of all pages and tasks with statistics
2. **All Tasks**: Aggregated view of tasks from all pages with search and filters
3. **Settings**: Manage tags, export data, and configure the application

### Creating Pages

1. Click **"+ Add Page"** in the sidebar
2. Choose either:
   - **Manual Create**: Enter a page name to start with an empty board
   - **Upload JSON**: Import an existing page data file

### Managing Tasks

1. Navigate to any page/board
2. Click **"+ Add Task"** in any column (To Do, In Progress, Completed)
3. Fill in task details:
   - Title (required)
   - Description (optional)
   - Date (defaults to today)
   - Tags (select from available tags)

### Task Status Flow

- **To Do**: New tasks
- **In Progress**: Tasks being worked on
- **Completed**: Finished tasks
- **Overdue**: Tasks automatically moved here when date passes without completion

### Tag Management

Tags can only be created in **Settings**:
1. Go to Settings page
2. Click **"Add Tag"**
3. Enter tag name
4. Tags are available globally across all pages

### Data Export

Export all your data from Settings:
1. Go to Settings page
2. Click **"Export All Data"**
3. Downloads a JSON file with all pages, tasks, and settings

## Data Structure

### Main Data File (`userdata/maindata.json`)

```json
{
  "theme": "light",
  "sidebar_collapsed": false,
  "tags": [
    {
      "id": "urgent",
      "name": "Urgent",
      "color": "#000000"
    }
  ]
}
```

### Page File (`userdata/pages/{page_id}.json`)

```json
{
  "id": "unique-page-id",
  "name": "Project Name",
  "tasks": [
    {
      "id": "unique-task-id",
      "title": "Task title",
      "description": "Task description",
      "tags": ["tag-id"],
      "timestamp": "2026-01-27",
      "status": "todo"
    }
  ]
}
```

## API Endpoints

### Pages
- `GET /api/pages` - List all pages
- `GET /api/page/{id}` - Get specific page
- `POST /api/page/create` - Create new page
- `POST /api/page/import` - Import page from JSON
- `DELETE /api/page/{id}` - Delete page

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/task/create` - Create task
- `PUT /api/task/update` - Update task
- `DELETE /api/task/delete` - Delete task

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings/update` - Update settings

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

Frontend dev server runs on `http://localhost:3000` with API proxy to backend.

### Backend Development

```bash
cd backend
python app.py
```

Backend runs on `http://localhost:5000`.

## Design Principles

### Visual Design
- **Monochrome only**: Black, white, and gray shades
- **No accent colors**: No blue, purple, or brand tints
- **Typography-focused**: Space Grotesk as brand anchor
- **Calm UI**: Open spacing, subtle shadows, rounded corners

### UX Principles
- **Local-first**: All data on filesystem
- **Instant load**: Fast, minimal bundle
- **Developer-grade**: Clean, professional, technical feel
- **No cruft**: No authentication, no cloud, no complexity

## Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.8+)
- Install dependencies: `pip install -r backend/requirements.txt`
- Check port 5000 is available

### Frontend not displaying
- Run `python start.py` and rebuild when prompted
- Or manually: `cd frontend && npm run build`
- Check `frontend/dist` folder exists

### Data not persisting
- Check `backend/userdata/` directory exists
- Ensure write permissions on the directory
- Check Flask console for error messages

## License

This project is provided as-is for local use.

## Contributing

This is a local-first application designed for personal use. Feel free to fork and customize for your needs.

---

**Udo** - Built for focused work, designed to stay out of your way.