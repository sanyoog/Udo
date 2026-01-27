import { useState, useEffect } from 'react';
import { Topbar } from '../components/Topbar';
import { api } from '../api';
import { Kanban, Clock, Timer, Calendar } from 'lucide-react';

export function Dashboard() {
  const [pages, setPages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [timerStats, setTimerStats] = useState(null);
  const [countdownStats, setCountdownStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pagesRes, tasksRes, timerRes, countdownRes] = await Promise.all([
        api.getPages(),
        api.getAllTasks(),
        fetch('/api/timer/stats').then(r => r.json()).catch(() => null),
        fetch('/api/countdown/stats').then(r => r.json()).catch(() => null)
      ]);
      
      if (pagesRes.success) setPages(pagesRes.pages);
      if (tasksRes.success) setTasks(tasksRes.tasks);
      setTimerStats(timerRes);
      setCountdownStats(countdownRes);
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

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Topbar title="Dashboard" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground animate-fade-in">Loading...</div>
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
            <div className="card p-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 animate-fade-in-up">
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

          {/* Timer & Countdown Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timer Stats */}
            {timerStats && (
              <div className="card p-6 animate-fade-in-up stagger-1">
                <div className="flex items-center gap-3 mb-4">
                  <Timer className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-semibold">Study Timer Stats</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sessions</span>
                    <span className="font-semibold">{timerStats.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Time</span>
                    <span className="font-semibold">{formatTime(timerStats.totalTime)}</span>
                  </div>
                  {timerStats.recentSessions && timerStats.recentSessions.length > 0 && (
                    <div className="pt-3 border-t dark:border-gray-800">
                      <div className="text-sm text-muted-foreground mb-2">Recent Sessions</div>
                      <div className="space-y-1">
                        {timerStats.recentSessions.slice(0, 3).map((session, i) => (
                          <div key={i} className="text-sm flex justify-between">
                            <span className="text-muted-foreground">
                              {new Date(session.startTime).toLocaleDateString()}
                            </span>
                            <span>{formatTime(session.duration)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Countdown Stats */}
            {countdownStats && (
              <div className="card p-6 animate-fade-in-up stagger-2">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-purple-500" />
                  <h3 className="text-lg font-semibold">Upcoming Events</h3>
                </div>
                {countdownStats.upcomingEvents && countdownStats.upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {countdownStats.upcomingEvents.slice(0, 3).map((event, i) => (
                      <div key={i} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{event.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {event.daysLeft} day{event.daysLeft !== 1 ? 's' : ''} left
                          </div>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: event.color }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                )}
              </div>
            )}
          </div>

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
