const Task = require('../models/Task');
const Project = require('../models/Project');
const mongoose = require('mongoose');

// @desc    Get dashboard analytics data
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const userIdStr = req.user.id;
    const userId = new mongoose.Types.ObjectId(userIdStr);
    
    // Base query for tasks assigned to or created by the user
    const taskQuery = {
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    };

    const currentDate = new Date();

    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      tasksByStatusAggregate,
      tasksByPriorityAggregate,
      recentTasks
    ] = await Promise.all([
      // Total tasks
      Task.countDocuments(taskQuery),
      // Completed tasks
      Task.countDocuments({ ...taskQuery, status: 'done' }),
      // Pending tasks
      Task.countDocuments({ ...taskQuery, status: { $in: ['todo', 'in-progress'] } }),
      // Overdue tasks
      Task.countDocuments({ ...taskQuery, status: { $ne: 'done' }, dueDate: { $lt: currentDate } }),
      // Tasks by status
      Task.aggregate([
        { $match: { $or: [{ createdBy: userId }, { assignedTo: userId }] } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Tasks by priority
      Task.aggregate([
        { $match: { $or: [{ createdBy: userId }, { assignedTo: userId }] } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      // Recent tasks
      Task.find(taskQuery)
        .populate('projectId', 'title')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    // Format tasks by status
    const tasksByStatus = tasksByStatusAggregate.map(item => ({
      name: item._id === 'todo' ? 'To Do' : item._id === 'in-progress' ? 'In Progress' : 'Done',
      value: item.count,
    }));

    // Format tasks by priority
    const tasksByPriority = tasksByPriorityAggregate.map(item => ({
      name: item._id ? item._id.charAt(0).toUpperCase() + item._id.slice(1) : 'Medium',
      value: item.count,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        tasksByStatus,
        tasksByPriority,
        recentTasks,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
