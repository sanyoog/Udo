import { useState, useEffect } from 'react';
import { Topbar } from '../components/Topbar';
import { api } from '../api';
import { Kanban, Clock, Timer, Calendar, BookOpen, AlertTriangle } from 'lucide-react';

export function Dashboard({ theme, onThemeToggle }) {
  const [pages, setPages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dayTrackerStats, setDayTrackerStats] = useState(null);
  const [countdownStats, setCountdownStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Calculate date range for day tracker
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [pagesData, tasksData, dayTrackerData, countdownData] = await Promise.all([
        api.getPages(),
        api.getTasks(),
        // Get date range for last 30 days
        fetch(`/api/daytracker/stats/range?start=${startDate}&end=${endDate}`).then(r => r.json()).catch(() => null),
        fetch('/api/countdown/stats').then(r => r.json()).catch(() => null)
      ]);

      setPages(pagesData);
      setTasks(tasksData);
      setDayTrackerStats(dayTrackerData);
      setCountdownStats(countdownData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { todo: 0, inProgress: 0, completed: 0, overdue: 0 };
    tasks.forEach(task => {
      if (task.status === 'todo') counts.todo++;
      else if (task.status === 'in-progress') counts.inProgress++;
      else if (task.status === 'completed') counts.completed++;
      else if (task.status === 'overdue') counts.overdue++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();
  const recentTasks = tasks.slice(0, 5);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Topbar title="Dashboard" theme={theme} onThemeToggle={onThemeToggle} />
        <div className="flex-1 flex items-center justify-center mobile-padding md:p-8">
          <div className="text-muted-foreground animate-fade-in">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Dashboard" theme={theme} onThemeToggle={onThemeToggle} />

      <div className="flex-1 overflow-y-auto mobile-padding md:p-8">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          {/* Stats Grid */}
          <div className="mobile-grid md:grid md:grid-cols-4 gap-4 animate-fade-in">
            <div className="card p-4 md:p-6 animate-bounce-in stagger-1 hover-lift">
              <div className="text-sm text-muted-foreground mb-2">Total Pages</div>
              <div className="text-2xl md:text-3xl font-bold">{pages.length}</div>
            </div>

            <div className="card p-4 md:p-6 animate-bounce-in stagger-2 hover-lift">
              <div className="text-sm text-muted-foreground mb-2">To Do</div>
              <div className="text-2xl md:text-3xl font-bold">{statusCounts.todo}</div>
            </div>

            <div className="card p-4 md:p-6 animate-bounce-in stagger-3 hover-lift">
              <div className="text-sm text-muted-foreground mb-2">In Progress</div>
              <div className="text-2xl md:text-3xl font-bold">{statusCounts.inProgress}</div>
            </div>

            <div className="card p-4 md:p-6 animate-bounce-in stagger-4 hover-lift">
              <div className="text-sm text-muted-foreground mb-2">Completed</div>
              <div className="text-2xl md:text-3xl font-bold">{statusCounts.completed}</div>
            </div>
          </div>

          {statusCounts.overdue > 0 && (
            <div className="card p-4 md:p-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 animate-shake">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div className="text-sm font-medium text-red-700 dark:text-red-400">Overdue Tasks</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-500">{statusCounts.overdue}</div>
            </div>
          )}

          {/* Day Tracker & Countdown Stats */}
          <div className="mobile-grid md:grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Day Tracker Stats */}
            {dayTrackerStats && (
              <div className="card p-4 md:p-6 animate-fade-in-left stagger-1 hover-lift">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-blue-500 flex-shrink-0 animate-pulse" />
                  <h3 className="text-lg font-semibold mobile-text">Study Tracking (30 Days)</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Study Days</span>
                    <span className="font-medium">{dayTrackerStats.totalDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Streak</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{dayTrackerStats.currentStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Longest Streak</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">{dayTrackerStats.longestStreak}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completion Rate</span>
                    <span className="font-medium">{dayTrackerStats.completionRate}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Countdown Stats */}
            {countdownStats && (
              <div className="card p-4 md:p-6 animate-fade-in-right stagger-2 hover-lift">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-purple-500 flex-shrink-0 animate-float" />
                  <h3 className="text-lg font-semibold mobile-text">Event Countdown</h3>
                </div>
                {countdownStats.upcomingEvents && countdownStats.upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {/* Next Event Highlight */}
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 animate-bounce-in hover-scale">
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Next Event</div>
                      <div className="font-semibold text-lg mobile-text">{countdownStats.upcomingEvents[0].name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 flex-shrink-0 animate-pulse-fast" />
                        {countdownStats.upcomingEvents[0].daysLeft} day{countdownStats.upcomingEvents[0].daysLeft !== 1 ? 's' : ''} left
                      </div>
                    </div>

                    <div className="pt-2 border-t dark:border-gray-800">
                      <div className="text-sm text-muted-foreground">
                        Total Events: {countdownStats.totalEvents}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No upcoming events</p>
                    <a href="/countdown" className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400">
                      Create your first event →
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pages Overview */}
          <div className="animate-fade-in-up stagger-3">
            <h3 className="text-lg font-semibold mb-4 mobile-text">Pages</h3>
            {pages.length === 0 ? (
              <div className="card p-6 md:p-8 text-center text-muted-foreground animate-scale-in">
                No pages yet. Create your first page from the sidebar.
              </div>
            ) : (
              <div className="mobile-grid md:grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {pages.map((page, index) => (
                  <a
                    key={page.id}
                    href={`/page/${page.id}`}
                    className="card p-4 md:p-6 animate-stagger-fade-in hover-lift"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Kanban className="w-5 h-5 flex-shrink-0 animate-pulse-fast" />
                      <h4 className="font-semibold mobile-text truncate">{page.name}</h4>
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
          <div className="animate-fade-in-up stagger-4">
            <h3 className="text-lg font-semibold mb-4 mobile-text">Recent Tasks</h3>
            {recentTasks.length === 0 ? (
              <div className="card p-6 md:p-8 text-center text-muted-foreground animate-scale-in">
                No tasks yet.
              </div>
            ) : (
              <div className="space-y-2">
                {recentTasks.map((task, index) => {
                  const statusClass = task.status === 'completed'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : task.status === 'in-progress'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-secondary';

                  return (
                    <div key={task.id} className="card p-4 animate-stagger-fade-in hover-lift" style={{ animationDelay: `${index * 0.03}s` }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium mobile-text truncate">{task.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {task.page_name} • {task.timestamp}
                          </div>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-md capitalize flex-shrink-0 animate-pulse-fast ${statusClass}`}>
                          {task.status.replace('-', ' ')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
