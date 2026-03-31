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
                                className={`bg-[var(--bg-card)] p-3.5 rounded-xl border ${
                                  snapshot.isDragging ? 'border-[var(--accent)] shadow-xl scale-[1.02] z-50 transform cursor-grabbing' : 
                                  (!canDrag ? 'border-[var(--border)] opacity-95' : 'border-[var(--border)] hover:border-[var(--border-focus)] hover:shadow-md cursor-grab')
                                } transition-all group relative`}
                              style={provided.draggableProps.style}
                            >
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <h3 className="font-semibold text-[var(--text-primary)] leading-tight">{task.title}</h3>
                                {isAdmin && (
                                  <button onClick={() => handleDeleteTask(task._id)} className="text-[var(--text-muted)] hover:text-[var(--error)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                              
                              {task.description && (
                                 <p className="text-[var(--text-secondary)] text-sm mb-4 line-clamp-2">{task.description}</p>
                              )}
                              
                              <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
                                {task.priority && (
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                )}

                                {task.attachment?.filename && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      downloadTaskAttachment(task._id, task.attachment.originalName);
                                    }}
                                    className="flex items-center gap-2 text-[10px] font-bold bg-[var(--bg-secondary)] text-[var(--accent)] border border-[var(--border)] px-2 py-0.5 rounded-md hover:border-[var(--border-focus)] hover:bg-[var(--bg-hover)] transition-colors shadow-sm"
                                    title={`Download ${task.attachment.originalName}`}
                                  >
                                    <span>{getFileIcon(task.attachment.mimetype)}</span>
                                    <span className="max-w-[80px] truncate">{task.attachment.originalName}</span>
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                  </button>
                                )}

                                {task.dueDate && (
                                  <div className="text-xs font-medium px-2 py-0.5 rounded bg-[var(--bg-hover)] text-[var(--text-secondary)] inline-flex items-center">
                                    <svg className="w-3 h-3 mr-1 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                  </div>
                                )}
                                
                                {task.assignedTo && (
                                  <div 
                                    className="w-6 h-6 rounded-full bg-[#3b82f6] border border-[#2563eb] flex items-center justify-center text-[10px] font-bold text-white ml-auto"
                                    title={`Assigned to ${task.assignedTo.name}`}
                                  >
                                     {task.assignedTo.name.charAt(0)}
                                  </div>
                                )}
                              </div>

                              {/* Review Action Buttons */}
                              <div className="mt-4 pt-3 border-t border-[var(--border)] flex flex-wrap gap-2">
                                {task.status === 'todo' && isAssignee && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(task._id, 'in-progress'); }}
                                    className="text-[11px] font-semibold bg-[#DBEAFE] text-[#1D4ED8] hover:bg-[#2563EB] hover:text-white px-3 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 w-full group shadow-sm"
                                  >
                                    🚀 Start Work
                                  </button>
                                )}

                                {task.status === 'in-progress' && isAssignee && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleSubmitForReview(task._id); }}
                                    className="text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309] hover:bg-[#F59E0B] hover:text-white px-3 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 w-full group shadow-sm"
                                  >
                                    ✨ Submit for Review
                                  </button>
                                )}

                                {task.status === 'pending_review' && isAdmin && (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleApproveTask(task._id); }}
                                      className="flex-1 text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] hover:bg-[#22C55E] hover:text-white px-3 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRejectTask(task._id); }}
                                      className="flex-1 text-[11px] font-semibold bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#EF4444] hover:text-white px-3 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}

                                {(task.submissionNote || task.reviewNote) && (
                                  <div className="w-full mt-1 p-2 rounded bg-[var(--bg-hover)] border border-[var(--border)] text-[10px] text-[var(--text-secondary)] italic">
                                    {task.submissionNote && <div>📝 Sub: {task.submissionNote}</div>}
                                    {task.reviewNote && <div className="mt-1 text-orange-300">💬 Lead: {task.reviewNote}</div>}
                                  </div>
                                )}
                              </div>
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

      <ActivityTimeline projectId={id} />

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
