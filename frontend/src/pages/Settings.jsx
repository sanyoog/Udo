import { useState, useEffect } from 'react';
import { Topbar } from '../components/Topbar';
import { Modal } from '../components/Modal';
import { api } from '../api';
import { Plus, Trash2, Download, Upload, Edit, Check, X } from 'lucide-react';

export function Settings({ theme, onThemeToggle }) {
  const [settings, setSettings] = useState(null);
  const [tags, setTags] = useState([]);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#808080');
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState([]);

  useEffect(() => {
    loadSettings();
    loadPages();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await api.getSettings();
      if (result.success) {
        setSettings(result.settings);
        setTags(result.settings.tags || []);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPages = async () => {
    try {
      const result = await api.getPages();
      if (result.success) {
        setPages(result.pages || []);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    }
  };

  const handleSyncPageTags = async (pageId) => {
    try {
      const result = await api.syncPageTags(pageId);
      if (result.success) {
        await loadSettings();
        alert(`Synced ${result.tags_added.length} new tags from page`);
      }
    } catch (error) {
      alert('Failed to sync tags');
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    const newTag = {
      id: newTagName.toLowerCase().replace(/\s+/g, '-'),
      name: newTagName,
      color: newTagColor
    };
    
    const updatedTags = [...tags, newTag];
    
    const result = await api.updateSettings({ tags: updatedTags });
    if (result.success) {
      setTags(updatedTags);
      setShowAddTagModal(false);
      setNewTagName('');
      setNewTagColor('#808080');
    }
  };

  const handleEditTag = async (tag) => {
    if (editingTag && editingTag.id === tag.id) {
      // Save changes
      const result = await api.updateTag(tag.id, {
        name: newTagName,
        color: newTagColor
      });
      
      if (result.success) {
        setTags(result.tags);
        setEditingTag(null);
        setNewTagName('');
        setNewTagColor('#808080');
      }
    } else {
      // Start editing
      setEditingTag(tag);
      setNewTagName(tag.name);
      setNewTagColor(tag.color);
    }
  };

  const cancelEditTag = () => {
    setEditingTag(null);
    setNewTagName('');
    setNewTagColor('#808080');
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm('Delete this tag? It will be removed from all tasks.')) return;
    
    const updatedTags = tags.filter(tag => tag.id !== tagId);
    
    const result = await api.updateSettings({ tags: updatedTags });
    if (result.success) {
      setTags(updatedTags);
    }
  };

  const handleExportData = async () => {
    try {
      // Get all data
      const [pagesRes, tasksRes, settingsRes] = await Promise.all([
        api.getPages(),
        api.getAllTasks(),
        api.getSettings()
      ]);
      
      const exportData = {
        exported_at: new Date().toISOString(),
        settings: settingsRes.settings,
        pages: pagesRes.pages,
        tasks: tasksRes.tasks
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `udo-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to export data');
    }
  };

  const handleResetWorkspace = async () => {
    if (!confirm('This will delete all pages and tasks. Are you sure?')) return;
    if (!confirm('This action cannot be undone. Continue?')) return;
    
    alert('Reset functionality would be implemented here. For safety, this is disabled in demo.');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Topbar title="Settings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col animate-fade-in">
        <Topbar title="Settings" theme={theme} onThemeToggle={onThemeToggle} />
        
        <div className="flex-1 overflow-y-auto mobile-padding md:p-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            {/* Theme Settings */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Theme</label>
                  <div className="text-sm text-muted-foreground">
                    Current theme: {settings?.theme || 'light'}. Use the sidebar toggle to change theme.
                  </div>
                </div>
              </div>
            </div>

            {/* Tag Management */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tags</h3>
                <button
                  onClick={() => setShowAddTagModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Tag
                </button>
              </div>
              
              {tags.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tags yet. Create your first tag.
                </div>
              ) : (
                <div className="space-y-2">
                  {tags.map(tag => (
                    <div key={tag.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                      {editingTag && editingTag.id === tag.id ? (
                        <>
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="color"
                              value={newTagColor}
                              onChange={(e) => setNewTagColor(e.target.value)}
                              className="w-10 h-10 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              className="input flex-1"
                              placeholder="Tag name"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditTag(tag)}
                              className="p-2 hover:bg-green-500/20 rounded-md transition-colors"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditTag}
                              className="p-2 hover:bg-red-500/20 rounded-md transition-colors"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="font-medium">{tag.name}</span>
                            <span className="text-sm text-muted-foreground">({tag.id})</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditTag(tag)}
                              className="p-2 hover:bg-secondary rounded-md transition-colors"
                              title="Edit tag"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              className="p-2 hover:bg-red-500/20 rounded-md transition-colors"
                              title="Delete tag"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Page Tag Sync */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Sync Tags from Pages</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Extract and add tags from imported pages to your global tag list
              </p>
              
              {pages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No pages available
                </div>
              ) : (
                <div className="space-y-2">
                  {pages.map(page => (
                    <div key={page.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                      <span className="font-medium">{page.name}</span>
                      <button
                        onClick={() => handleSyncPageTags(page.id)}
                        className="btn-secondary text-sm"
                      >
                        Sync Tags
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data Management */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Data Management</h3>
              <div className="space-y-3">
                <button
                  onClick={handleExportData}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export All Data
                </button>
                
                <div className="text-sm text-muted-foreground text-center">
                  Export all pages, tasks, and settings to a JSON file
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card p-6 border-red-200">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h3>
              <div className="space-y-3">
                <button
                  onClick={handleResetWorkspace}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Reset Workspace
                </button>
                
                <div className="text-sm text-muted-foreground text-center">
                  This will permanently delete all pages and tasks
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Tag Modal */}
      <Modal
        isOpen={showAddTagModal}
        onClose={() => {
          setShowAddTagModal(false);
          setNewTagName('');
          setNewTagColor('#808080');
        }}
        title="Add Tag"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tag Name</label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="input w-full"
              placeholder="Enter tag name"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="input flex-1"
                placeholder="#808080"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAddTagModal(false);
                setNewTagName('');
                setNewTagColor('#808080');
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTag}
              className="btn-primary flex-1"
              disabled={!newTagName.trim()}
            >
              Add Tag
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
