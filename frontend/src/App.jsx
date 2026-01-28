import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AllTasks } from './pages/AllTasks';
import { Settings } from './pages/Settings';
import { PageBoard } from './pages/PageBoard';
import DayTracker from './pages/DayTracker';
import Countdown from './pages/Countdown';
import { api } from './api';

function App() {
  const [pages, setPages] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    loadPages();
    loadSettings();
  }, []);

  useEffect(() => {
    // Apply theme to body
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const loadPages = async () => {
    try {
      const result = await api.getPages();
      if (result.success) {
        setPages(result.pages);
      }
    } catch (error) {
      console.error('Failed to load pages:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const result = await api.getSettings();
      if (result.success) {
        setTheme(result.settings.theme || 'light');
        setSidebarCollapsed(result.settings.sidebar_collapsed || false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleToggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    await api.updateSettings({ theme: newTheme });
  };

  const handleToggleSidebar = async () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    await api.updateSettings({ sidebar_collapsed: newState });
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-background">
        <Sidebar
          pages={pages}
          onPagesUpdate={loadPages}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          theme={theme}
          onThemeToggle={handleToggleTheme}
        />
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/all-tasks" element={<AllTasks />} />
          <Route path="/tracker" element={<DayTracker />} />
          <Route path="/countdown" element={<Countdown />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/page/:pageId" element={<PageBoard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
