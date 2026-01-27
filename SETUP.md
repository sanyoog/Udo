# Udo - Quick Setup Guide

## Installation Steps

### 1. Prerequisites
- Python 3.8 or higher
- (Optional) Node.js 16 or higher for frontend development

### 2. Quick Start

Open terminal in the Udo directory and run:

```bash
python start.py
```

This single command will:
1. Install Python dependencies if needed
2. Build the frontend if Node.js is available
3. Start the Flask backend
4. Serve the application at http://localhost:5000

### 3. First Time Setup

When you first access the application:

1. **Create Your First Page**
   - Click "+ Add Page" in the sidebar
   - Choose "Create New Page"
   - Enter a name like "My Tasks"

2. **Add Some Tags** (Optional)
   - Go to Settings (sidebar)
   - Click "Add Tag"
   - Create tags like "Urgent", "Important", etc.

3. **Create Your First Task**
   - Go to your new page
   - Click "+ Add Task" in the "To Do" column
   - Fill in the task details

### 4. Example Data

The project includes two example pages:
- **Project Alpha**: Shows various task statuses and tags
- **Personal Tasks**: Simple task list

You can delete these from their respective board pages.

## Development Mode

### Backend Development
```bash
cd backend
python app.py
```
Backend runs at http://localhost:5000

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```
Frontend dev server runs at http://localhost:3000

## Common Tasks

### Export Your Data
1. Go to Settings
2. Click "Export All Data"
3. Save the JSON file as backup

### Import a Page
1. Click "+ Add Page" in sidebar
2. Choose "Import from JSON"
3. Upload your page JSON file

### Reset Everything
Settings → Danger Zone → Reset Workspace
(Use with caution - deletes all data!)

## File Locations

- All data: `backend/userdata/`
- Settings: `backend/userdata/maindata.json`
- Pages: `backend/userdata/pages/*.json`

## Troubleshooting

**Port 5000 already in use?**
- Edit `backend/app.py`, change port number in last line
- Or stop other service using port 5000

**Frontend not showing?**
- Make sure you have Node.js installed
- Run `python start.py` again and rebuild

**Tasks not saving?**
- Check console for errors
- Verify `backend/userdata/` has write permissions

## Need Help?

Check the full README.md for:
- Complete API documentation
- Data structure details
- Advanced configuration
- Design principles

---

Ready to start? Run: `python start.py`
