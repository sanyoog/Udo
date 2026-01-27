import { X, Edit2, Calendar, AlertCircle, Eye } from 'lucide-react';

export function TaskCard({ task, tags, onEdit, onDelete, onView, showMoveButtons, onMove, canMoveLeft, canMoveRight, canComplete }) {
  const taskTags = tags.filter(tag => task.tags?.includes(tag.id));
  const today = new Date().toISOString().split('T')[0];
  
  // Parse date range or single date
  const getDateInfo = () => {
    if (!task.timestamp) return { isOverdue: false, isLastDay: false, displayDate: '' };
    
    let startDate, endDate;
    
    // Format: "2026-01-20:2026-01-30" or "2026-01-20-2026-01-30"
    if (task.timestamp.includes(':')) {
      [startDate, endDate] = task.timestamp.split(':');
    } else if (task.timestamp.includes('-') && task.timestamp.length > 10) {
      // Check if it's a range like "2026-01-20-2026-01-30"
      const parts = task.timestamp.split('-');
      if (parts.length === 6) {
        startDate = `${parts[0]}-${parts[1]}-${parts[2]}`;
        endDate = `${parts[3]}-${parts[4]}-${parts[5]}`;
      } else {
        startDate = endDate = task.timestamp;
      }
    } else {
      startDate = endDate = task.timestamp;
    }
    
    const isOverdue = endDate < today && task.status !== 'completed';
    const isLastDay = endDate === today && task.status !== 'completed';
    const displayDate = startDate === endDate ? startDate : `${startDate} → ${endDate}`;
    
    return { isOverdue, isLastDay, displayDate, startDate, endDate };
  };
  
  const { isOverdue, isLastDay, displayDate } = getDateInfo();

  return (
    <div className="space-y-2">
      <div className="card p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => onView && onView(task)}>
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm flex-1 pr-2">{task.title}</h4>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView && onView(task);
              }}
              className="p-1 hover:bg-secondary rounded transition-all"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(task);
              }}
              className="p-1 hover:bg-secondary rounded transition-all"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-red-50 dark:hover:bg-red-950 text-red-600 rounded transition-all"
              title="Delete task"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
        )}
        
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {isLastDay && (
            <span className="text-xs px-2 py-1 rounded-md bg-red-600 text-white font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              LAST DAY
            </span>
          )}
          {taskTags.map(tag => (
            <span
              key={tag.id}
              className="text-xs px-2 py-1 rounded-md bg-secondary"
            >
              {tag.name}
            </span>
          ))}
        </div>
        
        {task.timestamp && (
          <div className={`text-xs flex items-center gap-1 ${
            isLastDay ? 'text-red-600 font-bold' :
            isOverdue ? 'text-red-600 font-medium' : 
            'text-muted-foreground'
          }`}>
            <Calendar className="w-3 h-3" />
            {displayDate}
          </div>
        )}
      </div>
      
      {/* Move buttons below card */}
      {showMoveButtons && (
        <div className="flex gap-2 justify-center animate-fade-in">
          {canMoveLeft && (
            <button
              onClick={() => onMove('left')}
              className="px-3 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-all flex items-center gap-1"
            >
              ← Move Left
            </button>
          )}
          {canMoveRight && (
            <button
              onClick={() => onMove('right')}
              className="px-3 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded-md transition-all flex items-center gap-1"
            >
              Move Right →
            </button>
          )}
          {canComplete && (
            <button
              onClick={() => onMove('complete')}
              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded-md transition-all flex items-center gap-1"
            >
              ✓ Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
