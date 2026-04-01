import { useState, useEffect } from 'react';
import { getMyTasks, updateTask, downloadTaskAttachment, submitForReview } from '../api/taskService';
import DashboardLayout from '../components/DashboardLayout';
import { Link } from 'react-router-dom';

function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyTasks();
  }, []);

  const loadMyTasks = async () => {
    try {
      setLoading(true);
      const data = await getMyTasks();
      setTasks(data);
    } catch (error) {
      console.error('Error loading my tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map((task) =>
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      loadMyTasks();
    }
  };

  const handleSubmitForReview = async (taskId) => {
    const note = window.prompt('Add a note about your work (Optional):');
    if (note === null) return;
    try {
      await submitForReview(taskId, note);
      loadMyTasks();
    } catch (error) {
      console.error('Error submitting for review:', error);
    }
  };

  const getFileIcon = (type) => {
    if (!type) return '📎';
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet') || type === 'text/csv') return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📋';
    if (type === 'text/plain') return '📃';
    if (type.includes('zip')) return '🗜️';
    return '📎';
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return 'bg-[#EF4444] text-white';
      case 'medium': return 'bg-[#F59E0B] text-white';
      case 'low': return 'bg-[#3B82F6] text-white';
      default: return 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border)]';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-[var(--text-primary)]">Loading your tasks...</div>
      </DashboardLayout>
    );
  }

  const COLUMNS = [
    { key: 'todo',           label: 'To Do',          dotColor: 'bg-[#64748B]' },
    { key: 'in-progress',    label: 'In Progress',     dotColor: 'bg-[#2563EB]' },
    { key: 'pending_review', label: 'Pending Review',  dotColor: 'bg-[#F59E0B]' },
    { key: 'done',           label: 'Done',            dotColor: 'bg-[#22C55E]' },
  ];

  const groupedTasks = {
    'todo':           tasks.filter(t => t.status === 'todo'),
    'in-progress':    tasks.filter(t => t.status === 'in-progress'),
    'pending_review': tasks.filter(t => t.status === 'pending_review'),
    'done':           tasks.filter(t => t.status === 'done'),
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8 shrink-0">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Tasks</h1>
        <p className="text-[var(--text-secondary)] mt-1">Tasks specifically assigned to you across all projects.</p>
      </div>

      {tasks.length === 0 ? (
        <section className="empty-state-card mt-0">
          <div className="empty-icon">🎉</div>
          <h3>You&apos;re all caught up!</h3>
          <p>You don&apos;t have any tasks assigned to you right now.</p>
        </section>
      ) : (
        /* Kanban Board — columns side by side on xl, stacked below */
        <div className="flex flex-col xl:flex-row gap-4 pb-8 overflow-x-auto min-h-0">
          {COLUMNS.map(({ key, label, dotColor }) => {
            const colTasks = groupedTasks[key];
            return (
              <div
                key={key}
                className="flex-1 min-w-[280px] flex flex-col bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl overflow-hidden"
                style={{ maxHeight: 'calc(100vh - 220px)' }}
              >
                {/* Column header — fixed */}
                <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-[var(--text-secondary)]">
                      {label}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                {/* Scrollable card area */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
                  {colTasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-xs py-10">
                      No tasks here
                    </div>
                  )}

                  {colTasks.map((task) => (
                    <div
                      key={task._id}
                      className="bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)] hover:border-[var(--border-focus)] hover:shadow-md transition-all duration-200 flex flex-col gap-3 min-w-0"
                    >
                      {/* Title */}
                      <div>
                        <h3 className="font-semibold text-sm text-[var(--text-primary)] leading-snug truncate">
                          {task.title}
                        </h3>
                        {task.projectId?.title && (
                          <Link
                            to={`/projects/${task.projectId._id}`}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] mt-1 block truncate"
                          >
                            📂 {task.projectId.title}
                          </Link>
                        )}
                      </div>

                      {/* Description */}
                      {task.description && (
                        <p className="text-[var(--text-secondary)] text-xs line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Tags row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {task.priority && (
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-white/10 ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                        {task.dueDate && (
                          <div className="text-[10px] font-medium px-2 py-1 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] flex items-center border border-[var(--border)]">
                            <svg className="w-3 h-3 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                        {task.attachment?.filename && (
                          <button
                            onClick={() => downloadTaskAttachment(task._id, task.attachment.originalName)}
                            className="flex items-center gap-1.5 text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--accent-light)] border border-[var(--border)] px-2 py-1 rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all overflow-hidden max-w-[160px]"
                            title={`Download ${task.attachment.originalName}`}
                          >
                            <span className="opacity-80">{getFileIcon(task.attachment.mimetype)}</span>
                            <span className="truncate">{task.attachment.originalName}</span>
                          </button>
                        )}
                      </div>

                      {/* Action footer */}
                      <div className="mt-1 pt-3 border-t border-[var(--border)]">
                        {task.status === 'todo' && (
                          <button
                            onClick={() => handleUpdateStatus(task._id, 'in-progress')}
                            className="text-[10px] font-bold uppercase tracking-wide bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 w-full shadow-sm border border-blue-500/20 hover:border-blue-500"
                          >
                            Start Work
                          </button>
                        )}
                        {task.status === 'in-progress' && (
                          <button
                            onClick={() => handleSubmitForReview(task._id)}
                            className="text-[10px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 w-full shadow-sm border border-amber-500/20 hover:border-amber-500"
                          >
                            Submit for Review
                          </button>
                        )}
                        {task.status === 'pending_review' && (
                          <div className="text-[10px] font-medium text-[var(--text-muted)] text-center py-1">
                            ⏳ Awaiting review by team lead
                          </div>
                        )}
                        {task.status === 'done' && (
                          <div className="text-[10px] font-medium text-green-500 text-center py-1 flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            Completed
                          </div>
                        )}

                        {/* Notes */}
                        {(task.submissionNote || task.reviewNote) && (
                          <div className="mt-2 p-2.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)]">
                            {task.submissionNote && (
                              <div className="flex gap-1.5 leading-tight mb-1">
                                <span className="font-semibold px-1 bg-white/5 rounded">Log</span>
                                <span className="text-[var(--text-primary)]">{task.submissionNote}</span>
                              </div>
                            )}
                            {task.reviewNote && (
                              <div className="flex gap-1.5 leading-tight text-amber-500/90">
                                <span className="font-semibold px-1 bg-amber-500/10 rounded">Feedback</span>
                                <span>{task.reviewNote}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default MyTasks;
