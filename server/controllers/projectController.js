const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'Admin' }],
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { 'members.user': req.user._id }],
    }).sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('members.user', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.members.some((member) => member.user._id.equals(req.user._id));
    if (!project.createdBy._id.equals(req.user._id) && !isMember) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check Admin rights
    const userMember = project.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = project.createdBy.toString() === req.user._id.toString() || (userMember && userMember.role === 'Admin');

    if (!isAdmin) {
      return res.status(401).json({ message: 'Only Admins can delete the project' });
    }

    await Task.deleteMany({ projectId: project._id });
    await project.deleteOne();
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to a project
// @route   POST /api/projects/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check Admin rights
    const userMember = project.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = project.createdBy.toString() === req.user._id.toString() || (userMember && userMember.role === 'Admin');

    if (!isAdmin) {
      return res.status(401).json({ message: 'Only Admins can add members' });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    const alreadyMember = project.members.find(m => m.user.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return res.status(400).json({ message: 'User is already a member of this project' });
    }

    project.members.push({ user: userToAdd._id, role: role || 'Member' });
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove member from a project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check Admin rights
    const userMember = project.members.find(m => m.user.toString() === req.user._id.toString());
    const isAdmin = project.createdBy.toString() === req.user._id.toString() || (userMember && userMember.role === 'Admin');

    if (!isAdmin) {
      return res.status(401).json({ message: 'Only Admins can remove members' });
    }

    if (project.createdBy.toString() === req.params.userId) {
       return res.status(400).json({ message: 'Cannot remove the project creator' });
    }

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
  addMember,
  removeMember
};
