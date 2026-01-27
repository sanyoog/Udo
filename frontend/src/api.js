export const API_BASE = '/api';

export const api = {
  // Pages
  getPages: async () => {
    const res = await fetch(`${API_BASE}/pages`);
    return res.json();
  },
  
  getPage: async (pageId) => {
    const res = await fetch(`${API_BASE}/page/${pageId}`);
    return res.json();
  },
  
  createPage: async (name) => {
    const res = await fetch(`${API_BASE}/page/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
  
  importPage: async (data) => {
    const res = await fetch(`${API_BASE}/page/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  
  deletePage: async (pageId) => {
    const res = await fetch(`${API_BASE}/page/${pageId}`, {
      method: 'DELETE',
    });
    return res.json();
  },
  
  // Tasks
  getAllTasks: async () => {
    const res = await fetch(`${API_BASE}/tasks`);
    return res.json();
  },
  
  createTask: async (pageId, taskData) => {
    const res = await fetch(`${API_BASE}/task/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: pageId, ...taskData }),
    });
    return res.json();
  },
  
  updateTask: async (pageId, taskId, updates) => {
    const res = await fetch(`${API_BASE}/task/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: pageId, task_id: taskId, ...updates }),
    });
    return res.json();
  },
  
  deleteTask: async (pageId, taskId) => {
    const res = await fetch(`${API_BASE}/task/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: pageId, task_id: taskId }),
    });
    return res.json();
  },
  
  // Settings
  getSettings: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  
  updateSettings: async (settings) => {
    const res = await fetch(`${API_BASE}/settings/update`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },
  
  syncPageTags: async (pageId) => {
    const res = await fetch(`${API_BASE}/page/${pageId}/sync_tags`, {
      method: 'POST',
    });
    return res.json();
  },
  
  updatePageName: async (pageId, name) => {
    const res = await fetch(`${API_BASE}/page/${pageId}/update_name`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return res.json();
  },
  
  updateTag: async (tagId, updates) => {
    const res = await fetch(`${API_BASE}/settings/tag/${tagId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
};
