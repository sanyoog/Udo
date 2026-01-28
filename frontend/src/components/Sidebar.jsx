import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Kanban, Settings, Plus, ChevronLeft, ChevronRight, Moon, Sun, Timer, Calendar } from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../api';

export function Sidebar({ pages, onPagesUpdate, collapsed, onToggleCollapse, theme, onThemeToggle }) {
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState(null);
  const [newPageName, setNewPageName] = useState('');
  const [jsonFile, setJsonFile] = useState(null);

  const isActive = (path) => location.pathname === path;

  const handleCreatePage = async () => {
    if (!newPageName.trim()) return;
    
    const result = await api.createPage(newPageName);
    if (result.success) {
      onPagesUpdate();
      setShowAddModal(false);
      setNewPageName('');
      setAddMode(null);
    }
  };

  const handleImportPage = async () => {
    if (!jsonFile) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const result = await api.importPage(data);
        if (result.success) {
          onPagesUpdate();
          setShowAddModal(false);
          setJsonFile(null);
          setAddMode(null);
        }
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(jsonFile);
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setAddMode(null);
  };

  if (collapsed) {
    return (
      <div className="w-16 h-screen bg-white border-r border-border flex flex-col items-center py-6 gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-secondary rounded-md transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 h-screen bg-white border-r border-border flex flex-col">
        {/* Branding */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold tracking-tight">Udo</h1>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/') ? 'bg-secondary' : 'hover:bg-secondary/50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </Link>

          <Link
            to="/all-tasks"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/all-tasks') ? 'bg-secondary' : 'hover:bg-secondary/50'
            }`}
          >
            <Kanban className="w-5 h-5" />
            <span className="font-medium">All Tasks</span>
          </Link>

          <Link
            to="/tracker"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/tracker') ? 'bg-secondary' : 'hover:bg-secondary/50'
            }`}
          >
            <Timer className="w-5 h-5" />
            <span className="font-medium">Day Tracker</span>
          </Link>

          <Link
            to="/countdown"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/countdown') ? 'bg-secondary' : 'hover:bg-secondary/50'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Countdown</span>
          </Link>

          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive('/settings') ? 'bg-secondary' : 'hover:bg-secondary/50'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </Link>

          {/* Divider */}
          <div className="py-4">
            <div className="text-xs font-semibold text-muted-foreground px-3 mb-2">PAGES</div>
            <div className="space-y-1">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  to={`/page/${page.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    location.pathname === `/page/${page.id}` ? 'bg-secondary' : 'hover:bg-secondary/50'
                  }`}
                >
                  <Kanban className="w-4 h-4" />
                  <span className="font-medium truncate">{page.name}</span>
                </Link>
              ))}
              
              <button
                onClick={openAddModal}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Add Page</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom Utilities */}
        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={onThemeToggle}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium">Toggle Theme</span>
          </button>
          
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Collapse</span>
          </button>
        </div>
      </div>

      {/* Add Page Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setAddMode(null);
          setNewPageName('');
          setJsonFile(null);
        }}
        title="Add Page"
      >
        {!addMode ? (
          <div className="space-y-4">
            <button
              onClick={() => setAddMode('create')}
              className="w-full p-6 border-2 border-border rounded-lg hover:border-foreground transition-colors text-left"
            >
              <h3 className="font-semibold mb-2">Create New Page</h3>
              <p className="text-sm text-muted-foreground">Start with an empty board</p>
            </button>
            
            <button
              onClick={() => setAddMode('import')}
              className="w-full p-6 border-2 border-border rounded-lg hover:border-foreground transition-colors text-left"
            >
              <h3 className="font-semibold mb-2">Import from JSON</h3>
              <p className="text-sm text-muted-foreground">Upload a data.json file</p>
            </button>
          </div>
        ) : addMode === 'create' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Page Name</label>
              <input
                type="text"
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                className="input w-full"
                placeholder="Enter page name"
                autoFocus
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setAddMode(null)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleCreatePage}
                className="btn-primary flex-1"
                disabled={!newPageName.trim()}
              >
                Create Page
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload JSON File</label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setJsonFile(e.target.files[0])}
                className="input w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setAddMode(null)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleImportPage}
                className="btn-primary flex-1"
                disabled={!jsonFile}
              >
                Import Page
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
