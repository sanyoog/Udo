import React from 'react';
import { Link } from 'react-router-dom';
import { Topbar } from '../components/Topbar';

// StudyTimer removed — redirect users to Day Tracker
const StudyTimer = () => {
  return (
    <div className="flex-1 flex flex-col">
      <Topbar title="Study Timer" />
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Study Timer removed</h2>
          <p className="text-muted-foreground mb-4">The Study Timer has been replaced by the Day Tracker. Use manual entries to log work now.</p>
          <Link to="/tracker" className="btn-primary px-4 py-2">Open Day Tracker</Link>
        </div>
      </div>
    </div>
  );
};

export default StudyTimer;
