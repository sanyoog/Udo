# Development Notes

## Quick Reference

### Running the App
```bash
# Production (recommended)
python start.py

# Development - Backend only
cd backend && python app.py

# Development - Frontend only
cd frontend && npm run dev
```

### URLs
- **Production**: http://localhost:5000
- **Frontend Dev**: http://localhost:3000 (proxies API to :5000)
- **Backend API**: http://localhost:5000/api

### Testing the API

```bash
# Get all pages
curl http://localhost:5000/api/pages

# Get settings
curl http://localhost:5000/api/settings

# Get all tasks
curl http://localhost:5000/api/tasks

# Create a page
curl -X POST http://localhost:5000/api/page/create \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Page"}'
```

## Key Design Decisions

### Why File-Based Storage?
- **Simplicity**: No database setup or configuration
- **Transparency**: Users can see and edit their data
- **Portability**: Easy to backup, share, or migrate
- **Privacy**: Everything stays local

### Why Monochrome Design?
- **Timelessness**: Won't look dated
- **Focus**: No color distractions
- **Professional**: Developer-grade aesthetic
- **Flexibility**: Works in any context

### Why No Authentication?
- **Local-first**: Single user, local machine
- **Simplicity**: No need for users, passwords, sessions
- **Performance**: No auth overhead
- **Privacy**: No account creation required

## Component Architecture

### Data Flow
```
User Action → Component → API Client → Flask Backend → File System
                ↓                           ↓
            State Update ← JSON Response ← File Read/Write
```

### State Management
- React state for UI
- API calls for data persistence
- No Redux/Context needed (simple app)

## File System Structure

```
backend/userdata/
├── maindata.json          # Global settings (theme, tags, etc.)
└── pages/
    ├── {uuid-1}.json     # Page 1 with tasks
    ├── {uuid-2}.json     # Page 2 with tasks
    └── {uuid-n}.json     # Page N with tasks
```

## Extending the Application

### Adding a New Page Route
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Add navigation link in `frontend/src/components/Sidebar.jsx`

### Adding a New API Endpoint
1. Add function in `backend/file_manager.py` (if needed)
2. Create route in appropriate `backend/routes/*.py` file
3. Register blueprint in `backend/app.py` (if new file)
4. Add client function in `frontend/src/api.js`

### Adding a New Field to Tasks
1. Update task structure in `backend/file_manager.py`
2. Update TaskCard component in `frontend/src/components/TaskCard.jsx`
3. Update task creation modal in `frontend/src/pages/PageBoard.jsx`

### Customizing the Design
All design tokens are in `frontend/tailwind.config.js`:
- Colors
- Border radius
- Spacing
- Typography

## Performance Considerations

### Backend
- File I/O is fast for small JSON files
- Consider caching if dealing with 100+ pages
- UUID generation is lightweight

### Frontend
- Tailwind purges unused styles
- Vite optimizes bundle size
- React components are lightweight
- Lucide icons are tree-shakeable

## Security Notes

Since this is a local-first application:
- No external network calls
- No sensitive data transmission
- No authentication system
- Files are stored with user's OS permissions

If deploying to a server:
- Add authentication
- Add HTTPS
- Validate all inputs server-side
- Add rate limiting

## Potential Enhancements

### Features
- [ ] Drag-and-drop task reordering
- [ ] Task comments/notes
- [ ] Subtasks/checklists
- [ ] File attachments
- [ ] Search across all content
- [ ] Keyboard shortcuts
- [ ] Dark mode support (currently toggleable but not styled)
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Time tracking

### Technical
- [ ] SQLite for better performance at scale
- [ ] Full-text search
- [ ] Data compression
- [ ] Backup/restore automation
- [ ] Import from Trello/Notion
- [ ] Mobile responsive improvements
- [ ] PWA support
- [ ] Electron wrapper for desktop app

## Common Customizations

### Change the Port
Edit `backend/app.py`, line with `app.run()`:
```python
app.run(debug=True, host='0.0.0.0', port=8080)  # Change port here
```

### Change the Font
Edit `frontend/tailwind.config.js`:
```javascript
fontFamily: {
  sans: ['Your Font', 'system-ui', 'sans-serif'],
}
```

### Add Color Accent
If you want to break the monochrome rule:
1. Edit `frontend/tailwind.config.js` - add color
2. Edit `frontend/src/index.css` - use the color
3. Update component classes as needed

### Change Data Location
Edit `backend/file_manager.py`:
```python
USERDATA_DIR = "/your/custom/path"
```

## Troubleshooting Development

### Frontend Not Hot Reloading
- Check Vite dev server is running
- Ensure changes are saved
- Check browser console for errors

### Backend Changes Not Reflecting
- Restart Flask (or use Flask debug mode)
- Check for Python syntax errors
- Verify file was saved

### Tasks Not Saving
- Check Flask console for errors
- Verify file permissions on userdata/
- Check JSON syntax in files

### Build Failing
- Delete `frontend/node_modules/`
- Run `npm install` again
- Check Node version: `node --version`

## Testing Checklist

### Basic Functionality
- [ ] Create a page
- [ ] Add tasks to columns
- [ ] Move tasks between statuses
- [ ] Delete tasks
- [ ] Delete pages
- [ ] Create tags
- [ ] Apply tags to tasks
- [ ] Export data
- [ ] Import page from JSON

### UI/UX
- [ ] Sidebar collapses/expands
- [ ] Modals open/close properly
- [ ] Forms validate input
- [ ] Error messages display
- [ ] Loading states work
- [ ] Navigation works
- [ ] Responsive on mobile

### Data Persistence
- [ ] Refresh page - data persists
- [ ] Restart server - data persists
- [ ] Create multiple pages - all save
- [ ] Overdue tasks auto-update

---

Happy coding! 🚀
