const Task = require('../models/Task');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Reminder = require('../models/Reminder');
const path = require('path');
const fs = require('fs');

// ─── Helpers ────────────────────────────────────────────────────────────────

const calculateRemindAt = (dueDate, option) => {
  if (!dueDate || option === 'none' || !option) return null;
  const date = new Date(dueDate);
  switch (option) {
    case 'at_due_time':    return date;
    case '10_min_before':  return new Date(date.getTime() - 10 * 60000);
    case '30_min_before':  return new Date(date.getTime() - 30 * 60000);
    case '1_hour_before':  return new Date(date.getTime() - 60 * 60000);
    case '1_day_before':   return new Date(date.getTime() - 24 * 60 * 60000);
    default:               return null;
  }
};

const isProjectAdmin = (project, userId) => {
  if (!project) return false;
  const s = userId.toString();
  if (project.createdBy.toString() === s) return true;
  const m = project.members.find(m => m.user.toString() === s);
  return m && m.role === 'Admin';
};

const isProjectMember = (project, userId) => {
  if (!project) return false;
  const s = userId.toString();
  if (project.createdBy.toString() === s) return true;
  return project.members.some(m => m.user.toString() === s);
};

// Notify a list of userIds (skip the actor)
const notify = async (userIds, message, link, actorId) => {
  const targets = [...new Set(userIds.map(String))].filter(
    id => id !== actorId.toString()
  );
  await Promise.all(
    targets.map(uid => Notification.create({ userId: uid, message, link }))
  );
};

// ─── Create Task ─────────────────────────────────────────────────────────────

const createTask = async (req, res) => {
  try {
    const {
      title, description, projectId, status,
      dueDate, assignedTo, priority, order, reminderOption,
    } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (!isProjectMember(project, req.user._id))
      return res.status(403).json({ message: 'Not a member of this project' });

    if (assignedTo && !isProjectAdmin(project, req.user._id))
      return res.status(403).json({ message: 'Only Admins can assign tasks' });

    // Build attachment metadata if a file was uploaded
    let attachment = undefined;
    if (req.file) {
      attachment = {
        filename:     req.file.filename,
        originalName: req.file.originalname,
        mimetype:     req.file.mimetype,
        size:         req.file.size,
        uploadedAt:   new Date(),
      };
    }

    const task = await Task.create({
      title,
      description,
      projectId,
      createdBy:  req.user._id,
      assignedTo: assignedTo || null,
      status:     status || 'todo',
      dueDate,
      priority:   priority || 'medium',
      order:      order !== undefined ? order : 0,
      attachment,
    });

    await ActivityLog.create({
      action: 'TASK_CREATED',
      userId: req.user._id,
      projectId: task.projectId,
      taskId: task._id,
      details: `Created task "${task.title}"${attachment ? ' (with attachment)' : ''}`,
    });

    if (dueDate && reminderOption && reminderOption !== 'none') {
      const remindAt = calculateRemindAt(dueDate, reminderOption);
      if (remindAt) {
        await Reminder.create({
          taskId: task._id,
          userId: assignedTo || req.user._id,
          remindAt,
        });
      }
    }

    if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
      const msg = attachment
        ? `You were assigned task "${task.title}" — a reference file is attached.`
        : `You were assigned a new task: "${task.title}"`;
      await Notification.create({ userId: assignedTo, message: msg, link: `/projects/${projectId}` });
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ─── Get Tasks By Project ──────────────────────────────────────────────────

const getTasksByProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project || !isProjectMember(project, req.user._id))
      return res.status(403).json({ message: 'Not authorized to view tasks' });

    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Task ──────────────────────────────────────────────────────────

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    const isAdmin    = isProjectAdmin(project, req.user._id);
    const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignee)
      return res.status(403).json({ message: 'Not authorized to update this task' });

    // Members cannot directly set status to 'done' — they must use submit-for-review
    if (!isAdmin && req.body.status === 'done')
      return res.status(403).json({ message: 'Submit your work for review first. Only admins can mark tasks as done.' });

    // Members cannot set status to 'pending_review' via this generic endpoint
    if (!isAdmin && req.body.status === 'pending_review')
      return res.status(403).json({ message: 'Use the Submit for Review action instead.' });

    const oldStatus  = task.status;
    const oldAssignee = task.assignedTo ? task.assignedTo.toString() : null;

    let updates = req.body;
    if (!isAdmin && isAssignee) {
      updates = {};
      if (req.body.status) updates.status = req.body.status;
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('assignedTo', 'name email')
      .populate('createdBy',  'name email');

    if (updatedTask.status !== oldStatus) {
      await ActivityLog.create({
        action: 'STATUS_UPDATED',
        userId: req.user._id,
        projectId: task.projectId,
        taskId: task._id,
        details: `Changed status from ${oldStatus} to ${updatedTask.status}`,
      });

      const notifyIds = [
        updatedTask.assignedTo?._id,
        updatedTask.createdBy?._id,
      ].filter(Boolean);
      await notify(notifyIds, `Task "${updatedTask.title}" status changed to ${updatedTask.status}`, `/projects/${task.projectId}`, req.user._id);
    }

    if (
      updatedTask.assignedTo &&
      updatedTask.assignedTo._id.toString() !== oldAssignee &&
      updatedTask.assignedTo._id.toString() !== req.user._id.toString()
    ) {
      await ActivityLog.create({ action: 'TASK_ASSIGNED', userId: req.user._id, projectId: task.projectId, taskId: task._id, details: 'Assigned task to a new user' });
      await Notification.create({ userId: updatedTask.assignedTo._id, message: `You were assigned to task: "${updatedTask.title}"`, link: `/projects/${task.projectId}` });
    }

    if (req.body.dueDate !== undefined || req.body.reminderOption) {
      const remindAt = calculateRemindAt(updatedTask.dueDate, req.body.reminderOption);
      if (remindAt) {
        await Reminder.findOneAndUpdate(
          { taskId: updatedTask._id, status: 'pending' },
          { remindAt, status: 'pending', userId: updatedTask.assignedTo || updatedTask.createdBy },
          { upsert: true }
        );
      } else if (req.body.reminderOption === 'none' || !updatedTask.dueDate) {
        await Reminder.updateMany({ taskId: updatedTask._id }, { status: 'cancelled' });
      }
    }

    if (updatedTask.status === 'done') {
      await Reminder.updateMany({ taskId: updatedTask._id }, { status: 'cancelled' });
    }

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete Task ──────────────────────────────────────────────────────────

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!isProjectAdmin(project, req.user._id))
      return res.status(403).json({ message: 'Only Admins can delete tasks' });

    // Remove attached file from disk
    if (task.attachment?.filename) {
      const filePath = path.join(__dirname, '..', 'uploads', task.attachment.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Reminder.deleteMany({ taskId: task._id });
    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get My Tasks ─────────────────────────────────────────────────────────

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user._id })
      .populate('projectId', 'title')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Reorder Tasks ────────────────────────────────────────────────────────

const reorderTasks = async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !items.length)
      return res.status(400).json({ message: 'No items provided' });

    const itemIds      = items.map(i => i.id);
    const existingTasks = await Task.find({ _id: { $in: itemIds } });

    // Check admin status from first task's project
    const sampleTask = existingTasks[0];
    const project    = sampleTask ? await Project.findById(sampleTask.projectId) : null;
    const userIsAdmin = project ? isProjectAdmin(project, req.user._id) : false;

    // Build bulk ops — block non-admins from dragging to 'done'
    const bulkOps = [];
    for (const item of items) {
      const old = existingTasks.find(t => t._id.toString() === item.id);
      if (!userIsAdmin && item.status === 'done' && old?.status !== 'done') {
        // Silently revert to previous status for this item
        bulkOps.push({ updateOne: { filter: { _id: item.id }, update: { order: item.order, status: old.status } } });
      } else {
        bulkOps.push({ updateOne: { filter: { _id: item.id }, update: { order: item.order, status: item.status } } });
      }
    }

    await Task.bulkWrite(bulkOps);

    // Activity + notifications for status changes
    for (const item of items) {
      const old = existingTasks.find(t => t._id.toString() === item.id);
      const newStatus = (!userIsAdmin && item.status === 'done' && old?.status !== 'done') ? old.status : item.status;
      if (old && old.status !== newStatus) {
        await ActivityLog.create({ action: 'STATUS_UPDATED', userId: req.user._id, projectId: old.projectId, taskId: old._id, details: `Moved task from ${old.status} to ${newStatus}` });
        const notifyIds = [old.assignedTo, old.createdBy].filter(Boolean);
        await notify(notifyIds, `Task "${old.title}" was moved to ${newStatus}`, `/projects/${old.projectId}`, req.user._id);
      }
    }

    if (sampleTask) {
      await ActivityLog.create({ action: 'BOARD_REORDERED', userId: req.user._id, projectId: sampleTask.projectId, details: 'Reordered tasks on the board' });
    }

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Submit For Review ────────────────────────────────────────────────────

const submitForReview = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy',  'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!isProjectMember(project, req.user._id))
      return res.status(403).json({ message: 'Not a member of this project' });

    // Only the assignee (or an admin) can submit for review
    const isAssignee = task.assignedTo && task.assignedTo._id.toString() === req.user._id.toString();
    const isAdmin    = isProjectAdmin(project, req.user._id);
    if (!isAssignee && !isAdmin)
      return res.status(403).json({ message: 'Only the assigned member can submit for review' });

    if (!['in-progress', 'todo'].includes(task.status))
      return res.status(400).json({ message: 'Task is not in a reviewable state' });

    const { submissionNote } = req.body;
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { status: 'pending_review', submissionNote: submissionNote || '', reviewNote: '' },
      { new: true }
    ).populate('assignedTo', 'name email').populate('createdBy', 'name email');

    await ActivityLog.create({
      action: 'REVIEW_SUBMITTED',
      userId: req.user._id,
      projectId: task.projectId,
      taskId: task._id,
      details: `Submitted task "${task.title}" for review`,
    });

    // Notify all admins / project creator
    const adminIds = [
      project.createdBy,
      ...project.members.filter(m => m.role === 'Admin').map(m => m.user),
    ];
    await notify(adminIds, `📋 "${task.title}" has been submitted for review by ${req.user.name}`, `/projects/${task.projectId}`, req.user._id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Approve Task ────────────────────────────────────────────────────────

const approveTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy',  'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!isProjectAdmin(project, req.user._id))
      return res.status(403).json({ message: 'Only Admins can approve tasks' });

    if (task.status !== 'pending_review')
      return res.status(400).json({ message: 'Task is not pending review' });

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { status: 'done', reviewNote: '' },
      { new: true }
    ).populate('assignedTo', 'name email').populate('createdBy', 'name email');

    await Reminder.updateMany({ taskId: task._id }, { status: 'cancelled' });

    await ActivityLog.create({
      action: 'TASK_APPROVED',
      userId: req.user._id,
      projectId: task.projectId,
      taskId: task._id,
      details: `Approved task "${task.title}" — marked as done`,
    });

    if (updated.assignedTo) {
      await Notification.create({
        userId: updated.assignedTo._id,
        message: `✅ Your work on "${task.title}" has been approved and marked as Done!`,
        link: `/projects/${task.projectId}`,
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Reject Task ─────────────────────────────────────────────────────────

const rejectTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy',  'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!isProjectAdmin(project, req.user._id))
      return res.status(403).json({ message: 'Only Admins can reject tasks' });

    if (task.status !== 'pending_review')
      return res.status(400).json({ message: 'Task is not pending review' });

    const { reviewNote } = req.body;

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { status: 'in-progress', reviewNote: reviewNote || '' },
      { new: true }
    ).populate('assignedTo', 'name email').populate('createdBy', 'name email');

    await ActivityLog.create({
      action: 'TASK_REJECTED',
      userId: req.user._id,
      projectId: task.projectId,
      taskId: task._id,
      details: `Requested changes on "${task.title}"${reviewNote ? `: ${reviewNote}` : ''}`,
    });

    if (updated.assignedTo) {
      await Notification.create({
        userId: updated.assignedTo._id,
        message: `🔄 Changes requested on "${task.title}"${reviewNote ? `: ${reviewNote}` : ''}. Please redo and resubmit.`,
        link: `/projects/${task.projectId}`,
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Download Attachment ─────────────────────────────────────────────────

const downloadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.projectId);
    if (!isProjectMember(project, req.user._id))
      return res.status(403).json({ message: 'Not authorized' });

    if (!task.attachment?.filename)
      return res.status(404).json({ message: 'No attachment found on this task' });

    const filePath = path.join(__dirname, '..', 'uploads', task.attachment.filename);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: 'File not found on server' });

    res.setHeader('Content-Disposition', `attachment; filename="${task.attachment.originalName}"`);
    res.setHeader('Content-Type', task.attachment.mimetype);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  getMyTasks,
  reorderTasks,
  submitForReview,
  approveTask,
  rejectTask,
  downloadAttachment,
};
