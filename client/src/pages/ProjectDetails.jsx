import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjectById } from '../api/projectService';
import { getTasksByProject, createTask, updateTask, deleteTask, reorderTasks, downloadTaskAttachment, submitForReview, approveTask, rejectTask } from '../api/taskService';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CreateTaskModal from '../components/CreateTaskModal';
import ManageMembersModal from '../components/ManageMembersModal';
import DashboardLayout from '../components/DashboardLayout';
import ActivityTimeline from '../components/ActivityTimeline';

function ProjectDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  useEffect(() => {
    loadProjectAndTasks();
  }, [id]);

  const loadProjectAndTasks = async () => {
    try {
      setLoading(true);
      const [projectData, tasksData] = await Promise.all([
        getProjectById(id),
        getTasksByProject(id),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading project details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
    } catch (error) {
      console.error('Error updating task status:', error);
      loadProjectAndTasks();
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      // Find the max order for the target status column so it drops at the bottom
      const statusTasks = tasks.filter(t => t.status === taskData.status);
      const order = statusTasks.length;
      
      await createTask({ ...taskData, order });
      loadProjectAndTasks();
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteTask(taskId);
        setTasks(tasks.filter((t) => t._id !== taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const handleSubmitForReview = async (taskId) => {
    const note = window.prompt('Add a note about your work (Optional):');
    if (note === null) return;
    try {
      await submitForReview(taskId, note);
      loadProjectAndTasks();
    } catch (error) {
      console.error('Error submitting for review:', error);
    }
  };

  const handleApproveTask = async (taskId) => {
    if (!window.confirm('Approve this task? It will be marked as Done.')) return;
    try {
      await approveTask(taskId);
      loadProjectAndTasks();
    } catch (error) {
      console.error('Error approving task:', error);
    }
  };

  const handleRejectTask = async (taskId) => {
    const note = window.prompt('Feedback for the member (What needs to change?):');
    if (note === null) return;
    try {
      await rejectTask(taskId, note);
      loadProjectAndTasks();
    } catch (error) {
      console.error('Error rejecting task:', error);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // We do an optimistic UI update
    const sourceStatus = source.droppableId;
    const destStatus = destination.droppableId;

    // Reconstruct columns
    const columns = {
      'todo': tasks.filter(t => t.status === 'todo').sort((a,b) => a.order - b.order),
      'in-progress': tasks.filter(t => t.status === 'in-progress').sort((a,b) => a.order - b.order),
      'pending_review': tasks.filter(t => t.status === 'pending_review').sort((a,b) => a.order - b.order),
      'done': tasks.filter(t => t.status === 'done').sort((a,b) => a.order - b.order),
    };

    const sourceCol = Array.from(columns[sourceStatus]);
    const destCol = sourceStatus === destStatus ? sourceCol : Array.from(columns[destStatus]);
    
    // Remove from source
    const [movedTask] = sourceCol.splice(source.index, 1);
    
    // Add to dest
    movedTask.status = destStatus;
    destCol.splice(destination.index, 0, movedTask);

    // Update orders for affected columns
    const affectedTasks = [];
    
    const updateColumnOrders = (col) => {
      col.forEach((task, index) => {
        task.order = index;
        affectedTasks.push({ id: task._id, order: index, status: task.status });
      });
    };

    if (sourceStatus === destStatus) {
      updateColumnOrders(sourceCol);
    } else {
      updateColumnOrders(sourceCol);
      updateColumnOrders(destCol);
    }

    // Update the local state entirely
    const newTasks = [
      ...(sourceStatus === 'todo' || destStatus === 'todo' ? columns['todo'] : tasks.filter(t => t.status === 'todo')),
      ...(sourceStatus === 'in-progress' || destStatus === 'in-progress' ? columns['in-progress'] : tasks.filter(t => t.status === 'in-progress')),
      ...(sourceStatus === 'pending_review' || destStatus === 'pending_review' ? columns['pending_review'] : tasks.filter(t => t.status === 'pending_review')),
      ...(sourceStatus === 'done' || destStatus === 'done' ? columns['done'] : tasks.filter(t => t.status === 'done'))
    ];

    setTasks(newTasks);

    // Fire API silently
    try {
      await reorderTasks(affectedTasks);
    } catch (error) {
      console.error('Error reordering tasks:', error);
      loadProjectAndTasks(); // Revert on failure
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-[var(--text-primary)]">Loading project details...</div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center mt-20 text-xl font-semibold text-[var(--text-primary)]">Project not found</div>
      </DashboardLayout>
    );
  }

  const isAdmin = 
    project.createdBy._id === user._id || 
    project.members.some(m => m.user._id === user._id && m.role === 'Admin');

  // Ensure tasks are grouped and sorted by order
  const getSortedTasks = (status) => tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);
  const groupedTasks = {
    'todo': getSortedTasks('todo'),
    'in-progress': getSortedTasks('in-progress'),
    'pending_review': getSortedTasks('pending_review'),
    'done': getSortedTasks('done'),
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return 'bg-[#EF4444] text-white shadow-sm';
      case 'medium': return 'bg-[#F59E0B] text-white shadow-sm';
      case 'low': return 'bg-[#3B82F6] text-white shadow-sm';
      default: return 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border)]';
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

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024)           return `${bytes} B`;
    if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <Link to="/projects" className="text-[var(--text-secondary)] hover:text-[var(--accent)] mb-4 inline-flex items-center gap-2 transition-colors font-medium">
            <span>&larr;</span> Back to Projects
          </Link>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">{project.title}</h1>
          <p className="text-[var(--text-secondary)] mt-2 max-w-2xl">{project.description}</p>
          
          <div className="flex items-center gap-3 mt-4">
            <div className="flex -space-x-2">
              <div 
                className="w-8 h-8 rounded-full bg-[var(--accent)] border-2 border-[var(--bg-primary)] flex items-center justify-center text-xs font-bold text-white relative z-10" 
                title={`${project.createdBy.name} (Creator)`}
              >
                {project.createdBy.name.charAt(0)}
              </div>
              {project.members
                .filter(m => m.user._id !== project.createdBy._id)
                .slice(0, 4)
                .map((m, idx) => (
                <div 
                  key={m.user._id} 
                  className={`w-8 h-8 rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--bg-primary)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)] relative z-${9-idx}`}
                  title={`${m.user.name} (${m.role})`}
                >
                  {m.user.name.charAt(0)}
                </div>
              ))}
              {project.members.filter(m => m.user._id !== project.createdBy._id).length > 4 && (
                <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] border-2 border-[var(--bg-primary)] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                  +{project.members.filter(m => m.user._id !== project.createdBy._id).length - 4}
                </div>
              )}
            </div>
            
            {isAdmin && (
               <button onClick={() => setIsMemberModalOpen(true)} className="text-xs font-bold text-[var(--accent)] hover:text-white bg-[var(--accent-glow)] hover:bg-[var(--accent)] px-3 py-1.5 rounded-md transition shadow-sm">
                 Manage Team
               </button>
            )}
            
            <button onClick={() => setIsActivityModalOpen(true)} className="text-xs font-bold text-[var(--text-secondary)] hover:text-white bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] px-3 py-1.5 rounded-md transition border border-[var(--border)] flex items-center gap-1.5 shadow-sm">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Activity Log
            </button>
          </div>
        </div>
        
        {isAdmin && (
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="btn-primary whitespace-nowrap"
          >
            + Add Task
          </button>
        )}
      </div>

      {/* Kanban Board using dnd-kit */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col xl:flex-row gap-6 h-full pb-8 overflow-x-auto">
          {['todo', 'in-progress', 'pending_review', 'done'].map((status) => (
            <div key={status} className="flex-1 min-w-[300px] flex flex-col h-full min-h-[500px]">
              <div className="font-bold text-sm mb-4 text-[var(--text-primary)] uppercase tracking-wide flex justify-between items-center px-1">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shadow-sm ${
                    status === 'todo' ? 'bg-[#64748B]' : 
                    status === 'in-progress' ? 'bg-[#2563EB]' : 
                    status === 'pending_review' ? 'bg-[#F59E0B]' : 
                    'bg-[#22C55E]'
                  }`}></span>
                  <span className="font-semibold tracking-wider text-[11px] text-[var(--text-secondary)]">{status.replace('_', ' ').replace('-', ' ')}</span>
                </div>
                <span className="bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] text-[10px] py-0.5 px-2 rounded-full font-bold">
                  {groupedTasks[status].length}
                </span>
              </div>
              
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div 
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 rounded-xl p-2.5 border ${
                      snapshot.isDraggingOver ? 'bg-[var(--accent-glow)] border-[var(--accent)]' : 'bg-[var(--bg-secondary)] border-[var(--border)]'
                    } transition-all flex flex-col gap-2.5 min-h-[150px]`}
                  >
                    {groupedTasks[status].map((task, index) => {
                      const isAssignee = task.assignedTo?._id === user._id;
                      const canDrag = isAdmin; // Members cannot drag

                      return (
                        <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={!canDrag}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                                className={`bg-[var(--bg-card)] p-4 rounded-xl border ${
                                  snapshot.isDragging ? 'border-[var(--accent)] shadow-2xl scale-[1.02] z-50 cursor-grabbing' : 
                                  (!canDrag ? 'border-[var(--border)] opacity-95' : 'border-[var(--border)] hover:border-[var(--border-focus)] hover:shadow-lg cursor-grab')
                                } transition-all duration-200 group relative flex flex-col gap-3 min-w-0`}
                              style={provided.draggableProps.style}
                            >
                              <div className="flex justify-between items-start gap-3">
                                <h3 className="font-semibold text-sm text-[var(--text-primary)] leading-snug truncate">{task.title}</h3>
                                {isAdmin && (
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task._id); }} className="text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 bg-[var(--bg-hover)] p-1 rounded-md">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                              
                              {task.description && (
                                 <p className="text-[var(--text-secondary)] text-xs line-clamp-2 leading-relaxed">{task.description}</p>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-2 mt-auto">
                                {task.priority && (
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded border border-white/10 ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                )}

                                {task.dueDate && (
                                  <div className="text-[10px] font-medium px-2 py-1 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] flex items-center border border-[var(--border)]">
                                    <svg className="w-3 h-3 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                  </div>
                                )}
                                
                                {task.attachment?.filename && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadTaskAttachment(task._id, task.attachment.originalName);
                                    }}
                                    className="flex items-center gap-1.5 text-[10px] font-medium bg-[var(--bg-hover)] text-[var(--accent-light)] border border-[var(--border)] px-2 py-1 rounded hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all overflow-hidden max-w-[140px]"
                                    title={`Download ${task.attachment.originalName}`}
                                  >
                                    <span className="opacity-80">{getFileIcon(task.attachment.mimetype)}</span>
                                    <span className="truncate">{task.attachment.originalName}</span>
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center justify-between mt-1 pt-3 border-t border-[var(--border)]">
                                <div className="flex-1">
                                  {task.status === 'todo' && isAssignee && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task._id, 'in-progress'); }}
                                      className="text-[10px] font-bold uppercase tracking-wide bg-blue-500/10 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 w-auto shadow-sm border border-blue-500/20 hover:border-blue-500"
                                    >
                                      Start Work
                                    </button>
                                  )}

                                  {task.status === 'in-progress' && isAssignee && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSubmitForReview(task._id); }}
                                      className="text-[10px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded transition-all flex items-center justify-center gap-1.5 w-auto shadow-sm border border-amber-500/20 hover:border-amber-500 w-full"
                                    >
                                      Submit Review
                                    </button>
                                  )}

                                  {task.status === 'pending_review' && isAdmin && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleApproveTask(task._id); }}
                                        className="text-[10px] font-bold uppercase tracking-wide bg-green-500/10 text-green-500 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded transition-all shadow-sm border border-green-500/20 hover:border-green-500 flex-1"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleRejectTask(task._id); }}
                                        className="text-[10px] font-bold uppercase tracking-wide bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded transition-all shadow-sm border border-red-500/20 hover:border-red-500 flex-1"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {task.assignedTo && (
                                  <div 
                                    className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--bg-card)] flex-shrink-0 ml-3 relative"
                                    title={`Assigned to ${task.assignedTo.name}`}
                                  >
                                     {task.assignedTo.name.charAt(0)}
                                     <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--bg-card)]"></span>
                                  </div>
                                )}
                              </div>

                              {(task.submissionNote || task.reviewNote) && (
                                <div className="mt-1 p-2.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)]">
                                  {task.submissionNote && <div className="flex gap-1.5 leading-tight mb-1"><span className="opacity-70 font-semibold px-1 bg-white/5 rounded">Log</span> <span className="text-[var(--text-primary)]">{task.submissionNote}</span></div>}
                                  {task.reviewNote && <div className="flex gap-1.5 leading-tight text-amber-500/90"><span className="opacity-70 font-semibold px-1 bg-amber-500/10 rounded">Feedback</span> <span>{task.reviewNote}</span></div>}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Activity Timeline Side Drawer */}
      {isActivityModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setIsActivityModalOpen(false)}
          ></div>
          
          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] border-l border-[var(--border)] bg-[var(--bg-primary)] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--bg-primary)] sticky top-0 z-10">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Project History</h2>
              <button 
                onClick={() => setIsActivityModalOpen(false)}
                className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-[var(--error-bg)] transition-colors border border-transparent hover:border-red-500/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <ActivityTimeline projectId={id} />
            </div>
          </div>
        </>
      )}

      {isTaskModalOpen && (
        <CreateTaskModal
          projectId={id}
          isAdmin={isAdmin}
          members={project.members}
          onClose={() => setIsTaskModalOpen(false)}
          onSubmit={handleCreateTask}
        />
      )}

      {isMemberModalOpen && (
        <ManageMembersModal
          project={project}
          onClose={() => setIsMemberModalOpen(false)}
          onUpdate={loadProjectAndTasks}
        />
      )}
    </DashboardLayout>
  );
}

export default ProjectDetails;
