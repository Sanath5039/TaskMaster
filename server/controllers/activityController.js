const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');

// @desc    Get activity timeline for a project
// @route   GET /api/activities/project/:projectId
// @access  Private
exports.getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user has access to project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const hasAccess = project.createdBy.toString() === req.user.id || 
                      project.members.some(m => m.user.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Not authorized for this project' });
    }

    const activities = await ActivityLog.find({ projectId })
      .populate('userId', 'name email')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .limit(50); // limit to last 50 activities to avoid huge payloads

    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
