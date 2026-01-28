import { useState, useEffect } from 'react';
import { Topbar } from '../components/Topbar';
import { api } from '../api';
import { Kanban, Clock, Timer, Calendar, BookOpen } from 'lucide-react';

export function Dashboard() {
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
      // Get date range for last 30 days
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const [pagesRes, tasksRes, dayTrackerRes, countdownRes] = await Promise.all([
        api.getPages(),
        api.getAllTasks(),
        fetch(`/api/daytracker/stats/range?start=${startDate}&end=${endDate}`).then(r => r.json()).catch(() => null),
        fetch('/api/countdown/stats').then(r => r.json()).catch(() => null)
      ]);
      
      if (pagesRes.success) setPages(pagesRes.pages);
      if (tasksRes.success) setTasks(tasksRes.tasks);
      setDayTrackerStats(dayTrackerRes);
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

          {/* Day Tracker & Countdown Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Day Tracker Stats */}
            {dayTrackerStats && (
              <div className="card p-6 animate-fade-in-up stagger-1">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                  <h3 className="text-lg font-semibold">Study Tracking (30 Days)</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Hours</span>
                    <span className="font-semibold">{dayTrackerStats.totalHours}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days Tracked</span>
                    <span className="font-semibold">{dayTrackerStats.trackedDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Entries</span>
                    <span className="font-semibold">{dayTrackerStats.totalEntries}</span>
                  </div>
                  {dayTrackerStats.subjectBreakdown && Object.keys(dayTrackerStats.subjectBreakdown).length > 0 && (
                    <div className="pt-3 border-t dark:border-gray-800">
                      <div className="text-sm text-muted-foreground mb-2">Top Subjects</div>
                      <div className="space-y-1">
                        {Object.entries(dayTrackerStats.subjectBreakdown)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([subject, minutes]) => (
                            <div key={subject} className="text-sm flex justify-between">
                              <span className="text-muted-foreground truncate mr-2">{subject}</span>
                              <span>{Math.round(minutes / 60 * 10) / 10}h</span>
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
                  <h3 className="text-lg font-semibold">Event Countdown</h3>
                </div>
                {countdownStats.upcomingEvents && countdownStats.upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {/* Next Event Highlight */}
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Next Event</div>
                      <div className="font-semibold text-lg">{countdownStats.upcomingEvents[0].name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {countdownStats.upcomingEvents[0].daysLeft} day{countdownStats.upcomingEvents[0].daysLeft !== 1 ? 's' : ''} left
                      </div>
                    </div>
                    
                    {/* Other Upcoming Events */}
                    {countdownStats.upcomingEvents.slice(1, 4).length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Upcoming</div>
                        {countdownStats.upcomingEvents.slice(1, 4).map((event, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                              <div className="font-medium truncate">{event.name}</div>
                              <div className="text-muted-foreground">
                                {event.daysLeft} day{event.daysLeft !== 1 ? 's' : ''} left
                              </div>
                            </div>
                            <div
                              className="w-3 h-3 rounded-full ml-2"
                              style={{ backgroundColor: event.color }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
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
