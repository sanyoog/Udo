import { useState, useEffect } from 'react';
import { Topbar } from '../components/Topbar';
import { api } from '../api';
import { Kanban, Clock } from 'lucide-react';

export function Dashboard() {
  const [pages, setPages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pagesRes, tasksRes] = await Promise.all([
        api.getPages(),
        api.getAllTasks()
      ]);
      
      if (pagesRes.success) setPages(pagesRes.pages);
      if (tasksRes.success) setTasks(tasksRes.tasks);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecentTasks = () => {
    return tasks
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  };

  const getStatusCounts = () => {
    return {
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.status === 'overdue').length,
    };
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Topbar title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();
  const recentTasks = getRecentTasks();

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Dashboard" />
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="text-sm text-muted-foreground mb-2">Total Pages</div>
              <div className="text-3xl font-bold">{pages.length}</div>
            </div>
            
            <div className="card p-6">
              <div className="text-sm text-muted-foreground mb-2">To Do</div>
              <div className="text-3xl font-bold">{statusCounts.todo}</div>
            </div>
            
            <div className="card p-6">
              <div className="text-sm text-muted-foreground mb-2">In Progress</div>
              <div className="text-3xl font-bold">{statusCounts.inProgress}</div>
            </div>
            
            <div className="card p-6">
              <div className="text-sm text-muted-foreground mb-2">Completed</div>
              <div className="text-3xl font-bold">{statusCounts.completed}</div>
            </div>
          </div>

          {statusCounts.overdue > 0 && (
            <div className="card p-6 border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-red-600" />
                <div>
                  <div className="font-semibold">Overdue Tasks</div>
                  <div className="text-sm text-muted-foreground">
                    You have {statusCounts.overdue} overdue task{statusCounts.overdue !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pages Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Pages</h3>
            {pages.length === 0 ? (
              <div className="card p-8 text-center text-muted-foreground">
                No pages yet. Create your first page from the sidebar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pages.map(page => (
                  <a
                    key={page.id}
                    href={`/page/${page.id}`}
                    className="card p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Kanban className="w-5 h-5" />
                      <h4 className="font-semibold">{page.name}</h4>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {page.task_count} task{page.task_count !== 1 ? 's' : ''}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Recent Tasks */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Tasks</h3>
            {recentTasks.length === 0 ? (
              <div className="card p-8 text-center text-muted-foreground">
                No tasks yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentTasks.map(task => (
                  <div key={task.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {task.page_name} • {task.timestamp}
                        </div>
                      </div>
                      <div className="text-xs px-2 py-1 rounded-md bg-secondary capitalize">
                        {task.status.replace('-', ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
