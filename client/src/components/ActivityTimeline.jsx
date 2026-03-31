import { useState, useEffect } from 'react';
import { getProjectActivity } from '../api/activityService';
import { 
  Plus, 
  RefreshCcw, 
  UserPlus, 
  Layout, 
  History,
  Clock,
  ArrowRight
} from 'lucide-react';

const ActivityTimeline = ({ projectId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadActivities();
    }
  }, [projectId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await getProjectActivity(projectId);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionConfig = (action) => {
    switch(action) {
      case 'TASK_CREATED': 
        return {
          icon: <Plus className="w-3.5 h-3.5" />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10 border-blue-500/20'
        };
      case 'STATUS_UPDATED': 
        return {
          icon: <RefreshCcw className="w-3.5 h-3.5" />,
          color: 'text-orange-400',
          bg: 'bg-orange-500/10 border-orange-500/20'
        };
      case 'TASK_ASSIGNED': 
        return {
          icon: <UserPlus className="w-3.5 h-3.5" />,
          color: 'text-violet-400',
          bg: 'bg-violet-500/10 border-violet-500/20'
        };
      case 'BOARD_REORDERED': 
        return {
          icon: <Layout className="w-3.5 h-3.5" />,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10 border-slate-500/20'
        };
      default: 
        return {
          icon: <History className="w-3.5 h-3.5" />,
          color: 'text-slate-400',
          bg: 'bg-slate-500/10 border-slate-500/20'
        };
    }
  };

  const formatDetails = (details) => {
    if (!details) return '';
    // Highlight status names or task names if they are in quotes or specific keywords
    const parts = details.split(/(".*?")/g);
    return parts.map((part, i) => {
      if (part.startsWith('"') && part.endsWith('"')) {
        return <span key={i} className="font-semibold text-[var(--text-primary)]">{part.slice(1, -1)}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (loading) {
    return (
      <div className="mt-8 p-12 flex flex-col items-center justify-center bg-[var(--bg-hover)] rounded-2xl border border-[var(--border)] animate-pulse">
        <Clock className="w-6 h-6 text-[var(--text-muted)] mb-3" />
        <div className="text-[var(--text-secondary)] text-sm font-medium">Loading history...</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="mt-8 p-12 flex flex-col items-center justify-center bg-[var(--bg-hover)] rounded-2xl border border-dashed border-[var(--border)] text-center">
        <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
          <History className="w-6 h-6" />
        </div>
        <h4 className="text-[var(--text-primary)] font-medium">No activity yet</h4>
        <p className="text-[var(--text-secondary)] text-sm mt-1 max-w-xs">Actions taken on this project will appear here as a chronological timeline.</p>
      </div>
    );
  }

  return (
    <div className="mt-12 group/timeline">
      <div className="flex items-center gap-3 mb-8 px-1">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <History className="w-4 h-4 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Project Activity</h3>
        <div className="h-px flex-1 bg-gradient-to-r from-[var(--border)] to-transparent ml-2"></div>
      </div>
      
      <div className="relative space-y-1">
        {/* Continuous timeline line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-[var(--border)] via-[var(--border)] to-transparent"></div>

        {activities.map((activity, index) => {
          const config = getActionConfig(activity.action);
          return (
            <div key={activity._id} className="relative pl-12 pb-8 last:pb-0 group/item">
              {/* Point on timeline */}
              <div className={`absolute left-0 top-1.5 flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#0F172A] ${config.bg} z-10 transition-transform group-hover/item:scale-110 duration-200 shadow-xl`}>
                <div className={config.color}>{config.icon}</div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-bold text-[var(--text-primary)]">{activity.userId?.name || 'Unknown User'}</span>
                    <span className="text-[var(--text-secondary)] font-medium">{formatDetails(activity.details)}</span>
                  </div>
                  
                  {activity.taskId && (
                    <div className="mt-2.5 flex items-center gap-2 group/task overflow-hidden max-w-fit">
                      <div className="px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 hover:bg-white/[0.06] transition-colors cursor-default">
                        <span className={`w-1 h-1 rounded-full ${config.color.replace('text-', 'bg-')}`}></span>
                        {activity.taskId.title}
                      </div>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2 text-[11px] font-medium text-[var(--text-muted)] md:mt-0 mt-2">
                  <Clock className="w-3 h-3" />
                  {new Date(activity.createdAt).toLocaleString(undefined, { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;
