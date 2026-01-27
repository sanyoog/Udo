import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Topbar } from '../components/Topbar';
import { Modal } from '../components/Modal';
import { TaskCard } from '../components/TaskCard';
import { api } from '../api';
import { Plus, Trash2, Edit, ArrowLeft, ArrowRight, Check } from 'lucide-react';

export function PageBoard() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showEditPageModal, setShowEditPageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [pageName, setPageName] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    tags: [],
    timestamp: new Date().toISOString().split('T')[0],
    endDate: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPage();
    loadSettings();
  }, [pageId]);

  const loadPage = async () => {
    try {
      const result = await api.getPage(pageId);
      if (result.success) {
        setPage(result.page);
        setPageName(result.page.name);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const result = await api.getSettings();
      if (result.success) {
        setSettings(result.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const openAddTaskModal = (status) => {
    setSelectedColumn(status);
    setShowAddTaskModal(true);
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;
    
    // Format timestamp based on whether endDate is provided
    let timestamp = newTask.timestamp;
    if (newTask.endDate && newTask.endDate !== newTask.timestamp) {
      timestamp = `${newTask.timestamp}:${newTask.endDate}`;
    }
    
    const result = await api.createTask(pageId, {
      title: newTask.title,
      description: newTask.description,
      tags: newTask.tags,
      timestamp: timestamp,
      status: selectedColumn,
    });
    
    if (result.success) {
      await loadPage();
      setShowAddTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        tags: [],
        timestamp: new Date().toISOString().split('T')[0],
        endDate: '',
      });
    }
  };

  const openEditTaskModal = (task) => {
    // Parse timestamp range
    let startDate = task.timestamp;
    let endDate = '';
    
    if (task.timestamp && task.timestamp.includes(':')) {
      [startDate, endDate] = task.timestamp.split(':');
    } else if (task.timestamp && task.timestamp.includes('-') && task.timestamp.length > 10) {
      const parts = task.timestamp.split('-');
      if (parts.length === 6) {
        startDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
        endDate = `${parts[3]}-${parts[4]}-${parts[5]}`;
      }
    }
    
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      tags: task.tags || [],
      timestamp: startDate,
      endDate: endDate,
    });
    setShowEditTaskModal(true);
  };

  const handleEditTask = async () => {
    if (!newTask.title.trim() || !editingTask) return;
    
    // Format timestamp based on whether endDate is provided
    let timestamp = newTask.timestamp;
    if (newTask.endDate && newTask.endDate !== newTask.timestamp) {
      timestamp = `${newTask.timestamp}:${newTask.endDate}`;
    }
    
    const result = await api.updateTask(pageId, editingTask.id, {
      title: newTask.title,
      description: newTask.description,
      tags: newTask.tags,
      timestamp: timestamp,
    });
    
    if (result.success) {
      await loadPage();
      setShowEditTaskModal(false);
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        tags: [],
        timestamp: new Date().toISOString().split('T')[0],
        endDate: '',
      });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    
    const result = await api.deleteTask(pageId, taskId);
    if (result.success) {
      await loadPage();
    }
  };

  const handleDeletePage = async () => {
    if (!confirm(`Delete "${page.name}" and all its tasks?`)) return;
    
    const result = await api.deletePage(pageId);
    if (result.success) {
      navigate('/');
    }
  };

  const handleUpdatePageName = async () => {
    if (!pageName.trim()) return;
    
    const result = await api.updatePageName(pageId, pageName);
    if (result.success) {
      setPage({ ...page, name: pageName });
      setShowEditPageModal(false);
    }
  };

  const handleMoveTask = async (task, newStatus) => {
    const result = await api.updateTask(pageId, task.id, {
      status: newStatus,
    });
    
    if (result.success) {
      await loadPage();
    }
  };

  const openViewTaskModal = (task) => {
    setViewingTask(task);
    setShowDetailModal(true);
  };

  const toggleTag = (tagId) => {
    setNewTask(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const getTasksByStatus = (status) => {
    if (!page) return [];
    
    // Auto-move overdue tasks based on end date
    const today = new Date().toISOString().split('T')[0];
    return page.tasks.filter(task => {
      if (status === 'overdue') {
        // Check if end date (or single date) has passed
        let endDate = task.timestamp;
        if (task.timestamp && task.timestamp.includes(':')) {
          endDate = task.timestamp.split(':')[1];
        } else if (task.timestamp && task.timestamp.includes('-') && task.timestamp.length > 10) {
          const parts = task.timestamp.split('-');
          if (parts.length === 6) {
            endDate = `${parts[3]}-${parts[4]}-${parts[5]}`;
          }
        }
        return endDate < today && task.status !== 'completed';
      }
      return task.status === status;
    }).sort((a, b) => {
      // Sort by priority: last day tasks first
      const getEndDate = (timestamp) => {
        if (!timestamp) return '';
        if (timestamp.includes(':')) return timestamp.split(':')[1];
        if (timestamp.includes('-') && timestamp.length > 10) {
          const parts = timestamp.split('-');
          if (parts.length === 6) return `${parts[3]}-${parts[4]}-${parts[5]}`;
        }
        return timestamp;
      };
      
      const aEnd = getEndDate(a.timestamp);
      const bEnd = getEndDate(b.timestamp);
      const aIsLastDay = aEnd === today;
      const bIsLastDay = bEnd === today;
      
      if (aIsLastDay && !bIsLastDay) return -1;
      if (!aIsLastDay && bIsLastDay) return 1;
      return 0;
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col opacity-0 animate-fade-in">
        <Topbar title="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground animate-fade-in-up">Loading...</div>
        </div>
      </div>
    );
  }

  if (!page) {
    return null;
  }

  const columns = [
    { id: 'todo', title: 'To Do', canAdd: true },
    { id: 'in-progress', title: 'In Progress', canAdd: true },
    { id: 'completed', title: 'Completed', canAdd: true },
    { id: 'overdue', title: 'Overdue', canAdd: false },
  ];

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar 
          title={
            <div className="flex items-center gap-2">
              <span className="truncate">{page.name}</span>
              <button
                onClick={() => setShowEditPageModal(true)}
                className="p-1 hover:bg-secondary rounded-md transition-colors flex-shrink-0"
                title="Edit page name"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          } 
        />
        
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:p-8">
          <div className="flex md:items-start gap-4 md:gap-6 h-full min-w-max pb-4 flex-col md:flex-row">
            {columns.map((column, columnIndex) => {
              const tasks = getTasksByStatus(column.id);
              
              return (
                <div key={column.id} className="w-full md:w-80 flex flex-col h-auto md:h-full">
                  {/* Column Header */}
                  <div className="mb-4 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                        {column.title}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {tasks.length}
                      </span>
                    </div>
                    
                    {column.canAdd && (
                      <button
                        onClick={() => openAddTaskModal(column.id)}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-border rounded-lg hover:border-foreground hover:bg-secondary/50 transition-colors text-sm font-medium text-muted-foreground"
                      >
                        <Plus className="w-4 h-4" />
                        Add Task
                      </button>
                    )}
                  </div>
                  
                  {/* Tasks - Scrollable */}
                  <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-96 md:max-h-full">
                    {tasks.map((task, index) => (
                      <div key={task.id} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                        <TaskCard
                          task={task}
                          tags={settings?.tags || []}
                          onEdit={() => openEditTaskModal(task)}
                          onDelete={() => handleDeleteTask(task.id)}
                          onView={() => openViewTaskModal(task)}
                          showMoveButtons={true}
                          onMove={(direction) => {
                            if (direction === 'left' && columnIndex > 0) {
                              handleMoveTask(task, columns[columnIndex - 1].id);
                            } else if (direction === 'right' && columnIndex < columns.length - 2) {
                              handleMoveTask(task, columns[columnIndex + 1].id);
                            } else if (direction === 'complete') {
                              handleMoveTask(task, 'completed');
                            }
                          }}
                          canMoveLeft={columnIndex > 0 && column.id !== 'overdue'}
                          canMoveRight={columnIndex < columns.length - 2 && column.id !== 'completed'}
                          canComplete={column.id !== 'completed' && column.id !== 'overdue'}
                        />
                      </div>
                    ))}
                    
                    {tasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm animate-fade-in">
                        {column.id === 'overdue' ? 'No overdue tasks' : 'No tasks yet'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delete Page Button */}
        <div className="border-t border-border p-4">
          <button
            onClick={handleDeletePage}
            className="btn-ghost text-red-600 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Page
          </button>
        </div>
      </div>

      {/* Edit Page Name Modal */}
      <Modal
        isOpen={showEditPageModal}
        onClose={() => setShowEditPageModal(false)}
        title="Edit Page Name"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Page Name *</label>
            <input
              type="text"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              className="input w-full"
              placeholder="Enter page name"
              autoFocus
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => setShowEditPageModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePageName}
              className="btn-primary flex-1"
              disabled={!pageName.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTaskModal}
        onClose={() => {
          setShowAddTaskModal(false);
          setNewTask({
            title: '',
            description: '',
            tags: [],
            timestamp: new Date().toISOString().split('T')[0],
            endDate: '',
          });
        }}
        title="Add Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="input w-full"
              placeholder="Enter task title"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="textarea w-full"
              placeholder="Enter task description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date *</label>
              <input
                type="date"
                value={newTask.timestamp}
                onChange={(e) => setNewTask({ ...newTask, timestamp: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date (optional)</label>
              <input
                type="date"
                value={newTask.endDate}
                onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                className="input w-full"
                min={newTask.timestamp}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for single day</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            {settings?.tags && settings.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {settings.tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      newTask.tags.includes(tag.id)
                        ? 'bg-foreground text-background'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No tags available. Create tags in Settings.
              </div>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 pt-4">
            <button
              onClick={() => {
                setShowAddTaskModal(false);
                setNewTask({
                  title: '',
                  description: '',
                  tags: [],
                  timestamp: new Date().toISOString().split('T')[0],
                  endDate: '',
                });
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              className="btn-primary flex-1"
              disabled={!newTask.title.trim()}
            >
              Add Task
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={showEditTaskModal}
        onClose={() => {
          setShowEditTaskModal(false);
          setEditingTask(null);
          setNewTask({
            title: '',
            description: '',
            tags: [],
            timestamp: new Date().toISOString().split('T')[0],
            endDate: '',
          });
        }}
        title="Edit Task"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="input w-full"
              placeholder="Enter task title"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="textarea w-full"
              placeholder="Enter task description"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date *</label>
              <input
                type="date"
                value={newTask.timestamp}
                onChange={(e) => setNewTask({ ...newTask, timestamp: e.target.value })}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date (optional)</label>
              <input
                type="date"
                value={newTask.endDate}
                onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                className="input w-full"
                min={newTask.timestamp}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for single day</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            {settings?.tags && settings.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {settings.tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      newTask.tags.includes(tag.id)
                        ? 'bg-foreground text-background'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No tags available. Create tags in Settings.
              </div>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row gap-2 pt-4">
            <button
              onClick={() => {
                setShowEditTaskModal(false);
                setEditingTask(null);
                setNewTask({
                  title: '',
                  description: '',
                  tags: [],
                  timestamp: new Date().toISOString().split('T')[0],
                  endDate: '',
                });
              }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleEditTask}
              className="btn-primary flex-1"
              disabled={!newTask.title.trim()}
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setViewingTask(null);
        }}
        title="Task Details"
      >
        {viewingTask && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{viewingTask.title}</h3>
              {viewingTask.description && (
                <p className="text-sm text-muted-foreground">{viewingTask.description}</p>
              )}
            </div>
            
            <div className="border-t border-border pt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <p className="text-sm mt-1 capitalize">{viewingTask.status.replace('-', ' ')}</p>
              </div>
              
              {viewingTask.timestamp && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <p className="text-sm mt-1">{viewingTask.timestamp}</p>
                </div>
              )}
              
              {viewingTask.tags && viewingTask.tags.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {viewingTask.tags.map(tagId => {
                      const tag = (settings?.tags || []).find(t => t.id === tagId);
                      return tag ? (
                        <span key={tagId} className="text-xs px-2 py-1 rounded-md bg-secondary">
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              
              {viewingTask.priority && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <p className="text-sm mt-1 capitalize">{viewingTask.priority}</p>
                </div>
              )}
              
              {viewingTask.meta && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Additional Info</label>
                  <div className="text-sm mt-1 space-y-1">
                    {viewingTask.meta.focus_required && (
                      <p>• Focus required</p>
                    )}
                    {viewingTask.meta.duration_days && (
                      <p>• Duration: {viewingTask.meta.duration_days} days</p>
                    )}
                    {viewingTask.meta.daily_target && (
                      <p>• Daily target: {viewingTask.meta.daily_target}</p>
                    )}
                    {viewingTask.meta.notes && (
                      <p>• {viewingTask.meta.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openEditTaskModal(viewingTask);
                }}
                className="btn-primary flex-1"
              >
                Edit Task
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setViewingTask(null);
                }}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
