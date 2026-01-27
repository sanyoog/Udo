import { useState, useEffect } from 'react';
import { Topbar } from '../components/Topbar';
import { api } from '../api';
import { Search } from 'lucide-react';

export function AllTasks() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [searchQuery, statusFilter, tasks]);

  const loadTasks = async () => {
    try {
      const result = await api.getAllTasks();
      if (result.success) {
        setTasks(result.tasks);
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.page_name.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Topbar title="All Tasks" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="All Tasks" />
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="input w-full pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input md:w-48"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Tasks Count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <div className="card p-8 text-center text-muted-foreground">
              {searchQuery || statusFilter !== 'all' ? 'No tasks match your filters' : 'No tasks yet'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(task => (
                <div key={task.id} className="card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{task.page_name}</span>
                        <span>•</span>
                        <span>{task.timestamp}</span>
                      </div>
                    </div>
                    <div className={`text-xs px-3 py-1 rounded-md capitalize whitespace-nowrap ml-4 ${
                      task.status === 'overdue' ? 'bg-red-100 text-red-700' :
                      task.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-secondary'
                    }`}>
                      {task.status.replace('-', ' ')}
                    </div>
                  </div>
                  
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {task.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-md bg-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
