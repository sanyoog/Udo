# Udo Quick Start Guide

## 🚀 Getting Started

### Start the Application
```bash
cd /workspaces/Udo
python start.py
```

Visit: **http://localhost:5000**

---

## 🎯 Key Features

### 1️⃣ Create a Page
1. Click **"+ Add Page"** in sidebar
2. Choose "Create New Page" or "Import from JSON"
3. Enter page name
4. Start adding tasks!

### 2️⃣ Add a Task
1. Go to any page
2. Click **"+ Add Task"** in a column (To Do, In Progress, Completed)
3. Fill in:
   - **Title** (required)
   - **Description** (optional)
   - **Start Date** (required)
   - **End Date** (optional - for date ranges)
   - **Tags** (click to select)
4. Click "Add Task"

### 3️⃣ Edit a Task
- **Hover** over any task card
- Click the **✏️ edit icon** or click anywhere on the card
- Modify any fields
- Click "Save Changes"

### 4️⃣ Date Ranges
**Single Day Task:**
- Set Start Date only
- Leave End Date empty
- Example: January 27

**Multi-Day Task:**
- Set Start Date: January 20
- Set End Date: January 30
- Displays as: "2026-01-20 → 2026-01-30"

### 5️⃣ Last Day Priority
**Automatic feature:**
- When end date = today
- Task shows red **"🔴 LAST DAY"** badge
- Appears at top of column
- Can't miss urgent deadlines!

### 6️⃣ Manage Tags
1. Go to **Settings** page
2. Click **"+ Add Tag"**
3. Enter tag name
4. Use tags when creating/editing tasks

### 7️⃣ Switch Theme
- Click **🌙/☀️ icon** in sidebar
- Toggles between light and dark mode
- Theme saves automatically

### 8️⃣ View All Tasks
- Click **"All Tasks"** in sidebar
- See tasks from all pages
- Search and filter by status
- Find anything quickly

---

## 📊 Task Board Layout

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   To Do     │ In Progress │  Completed  │   Overdue   │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ + Add Task  │ + Add Task  │ + Add Task  │   (auto)    │
│             │             │             │             │
│ [Task 1]    │ [Task 3]    │ [Task 5]    │ [Task 7]    │
│ [Task 2]    │ [Task 4]    │ [Task 6]    │             │
│             │             │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
        ← Scroll horizontally to view all →
```

**Columns:**
- **To Do**: New tasks
- **In Progress**: Active work
- **Completed**: Finished tasks
- **Overdue**: Auto-populated when deadlines pass

---

## 🎨 Task Card Anatomy

```
┌────────────────────────────────────────┐
│ Task Title                    [✏️] [❌] │ ← Hover to see buttons
│                                         │
│ Description text here...                │
│                                         │
│ [🔴 LAST DAY] [Tag 1] [Tag 2]         │ ← Last day badge (if today)
│                                         │
│ 📅 2026-01-20 → 2026-01-30             │ ← Date range
└────────────────────────────────────────┘
```

---

## 📁 Data Structure

### Main Settings
**File:** `backend/userdata/maindata.json`
- Theme preference
- Sidebar state
- Global tags

### Pages
**Location:** `backend/userdata/pages/`
- Each page = separate JSON file
- Contains all tasks for that page
- UUID-based filenames

### Backup Your Data
1. Go to **Settings**
2. Click **"Export All Data"**
3. Downloads JSON file with everything
4. Keep as backup!

---

## 💡 Pro Tips

### Date Management
- ✅ Use single dates for one-day tasks
- ✅ Use ranges for multi-day projects
- ✅ System auto-detects last day
- ✅ Overdue tasks move automatically

### Organization
- 🏷️ Create tags for categories (Urgent, Bug, Feature, etc.)
- 📋 Use pages for different projects
- 🔍 Use "All Tasks" to search across everything
- 📊 Check Dashboard for overview

### Workflow
1. Morning: Check Dashboard for overdue tasks
2. Work: Update task status as you progress
3. Evening: Review what's completed
4. Weekly: Export data as backup

### Dark Mode
- 🌙 Better for night work
- 🔋 Saves battery on OLED screens
- 👀 Reduces eye strain
- 🎨 Still looks professional

---

## ⌨️ Keyboard Shortcuts

Currently none - but you can add them!
Check `DEVELOPMENT.md` for customization tips.

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
lsof -i:5000

# Kill process if needed
lsof -ti:5000 | xargs kill -9

# Restart
python start.py
```

### Tasks not saving
- Check browser console for errors
- Verify backend is running
- Check file permissions on `backend/userdata/`

### Theme not changing
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Check browser console
- Verify Settings page saves correctly

### Scroll issues
- Try different browser
- Check browser zoom level (should be 100%)
- Clear browser cache

---

## 📚 More Help

- **Full Documentation:** `README.md`
- **Feature Updates:** `FEATURE_UPDATES.md`
- **Data Format:** `example.data.json.txt`
- **Developer Guide:** `DEVELOPMENT.md`

---

## 🎉 You're All Set!

Udo is designed to be simple and stay out of your way.

- ✅ No login required
- ✅ No cloud sync
- ✅ All data local
- ✅ Fast and minimal
- ✅ Professional design

**Focus on your work, not your task manager.**

---

Built with ❤️ for productivity
