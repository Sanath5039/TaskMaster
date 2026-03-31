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
      loadMyTasks(); // Revert on failure
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
    if (type.startsWith('image/'))                                              return '🖼️';
    if (type === 'application/pdf')                                             return '📄';
    if (type.includes('word'))                                                  return '📝';
    if (type.includes('excel') || type.includes('spreadsheet') || type === 'text/csv') return '📊';
    if (type.includes('powerpoint') || type.includes('presentation'))          return '📋';
    if (type === 'text/plain')                                                  return '📃';
    if (type.includes('zip'))                                                   return '🗜️';
    return '📎';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-[var(--text-primary)]">Loading your tasks...</div>
      </DashboardLayout>
    );
  }

  const groupedTasks = {
    'todo': tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'pending_review': tasks.filter(t => t.status === 'pending_review'),
    'done': tasks.filter(t => t.status === 'done'),
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
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
        <div className="flex flex-col xl:flex-row gap-6 h-full pb-8 overflow-x-auto">
          {['todo', 'in-progress', 'pending_review', 'done'].map((status) => (
            <div key={status} className="flex-1 min-w-[300px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4 min-h-[500px] flex flex-col">
              <style>{`select option { background: var(--bg-card); color: var(--text-primary); }`}</style>
              <div className="font-bold text-sm mb-4 text-[var(--text-primary)] uppercase tracking-wide flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shadow-sm ${
                    status === 'todo' ? 'bg-[#64748B]' : 
                    status === 'in-progress' ? 'bg-[#2563EB]' : 
                    status === 'pending_review' ? 'bg-[#F59E0B]' :
                    'bg-[#22C55E]'
                  }`}></span>
                  <span className="font-semibold tracking-wider text-[11px] text-[var(--text-secondary)]">{status.replace('_', ' ').replace('-', ' ')}</span>
                </div>
                <span className="bg-[var(--bg-hover)] text-[var(--text-secondary)] text-xs py-1 px-2 rounded font-semibold">
                  {groupedTasks[status].length}
                </span>
              </div>
              
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                {groupedTasks[status].map((task) => (
                  <div key={task._id} className="bg-[var(--bg-card)] p-4 rounded-lg border border-[var(--border)] hover:border-[var(--border-focus)] transition-colors">
                    <div className="mb-2">
                      <h3 className="font-semibold text-[var(--text-primary)]">{task.title}</h3>
                      {task.projectId?.title && (
                        <Link to={`/projects/${task.projectId._id}`} className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] hover:underline mt-1 block">
                          📂 {task.projectId.title}
                        </Link>
                      )}
                    </div>
                    {task.description && (
                       <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2">{task.description}</p>
                    )}
                    {task.dueDate && (
                      <div className="text-xs font-medium px-2 py-1 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] inline-flex items-center mb-4">
                        <svg className="w-3 h-3 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                      </div>
                    )}

                    {task.attachment?.filename && (
                      <div className="mb-4">
                        <button 
                          onClick={() => downloadTaskAttachment(task._id, task.attachment.originalName)}
                          className="flex items-center gap-2 text-[10px] font-bold bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border)] px-2.5 py-1.5 rounded-lg hover:border-[var(--border-focus)] hover:bg-[var(--bg-hover)] transition-colors w-full justify-center shadow-sm"
                          title={`Download ${task.attachment.originalName}`}
                        >
                          <span>{getFileIcon(task.attachment.mimetype)}</span>
                          <span className="truncate">{task.attachment.originalName}</span>
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </button>
                      </div>
                    )}
                    
                    <div className="mt-auto pt-3 border-t border-[var(--border)]">
                      {task.status === 'in-progress' ? (
                        <button
                          onClick={() => handleSubmitForReview(task._id)}
                          className="text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309] hover:bg-[#F59E0B] hover:text-white px-3 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 w-full group shadow-sm mt-3"
                        >
                          ✨ Submit for Review
                        </button>
                      ) : (
                        <select
                          value={task.status}
                          onChange={(e) => handleUpdateStatus(task._id, e.target.value)}
                          disabled={task.status === 'pending_review' || task.status === 'done'}
                          className="text-xs font-medium border border-[var(--border)] rounded w-full py-1.5 px-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="todo">Status: To Do</option>
                          <option value="in-progress">Status: In Progress</option>
                          <option value="pending_review" disabled>Status: Pending Review</option>
                          <option value="done" disabled>Status: Done</option>
                        </select>
                      )}
                      
                      {(task.submissionNote || task.reviewNote) && (
                        <div className="mt-3 p-2 rounded bg-[var(--bg-hover)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] italic">
                          {task.submissionNote && <div>📝 Sub: {task.submissionNote}</div>}
                          {task.reviewNote && <div className="mt-1 text-orange-300">💬 Lead: {task.reviewNote}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

export default MyTasks;
