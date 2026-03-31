const User = require('../models/User');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize default preferences if they don't exist
    if (!user.preferences || !user.preferences.notifications) {
      user.preferences = {
        notifications: {
          email: true,
          inApp: true,
          taskAssignment: true,
          taskStatus: true,
          comments: true,
        },
        reminders: {
          enabled: true,
          defaultOffset: '10_min_before'
        },
        appearance: {
          theme: 'system'
        }
      };
      await user.save();
    }

    res.json(user.preferences);
  } catch (error) {
    console.error('Get settings error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { notifications, reminders, appearance } = req.body;
    
    let updatedPreferences = user.preferences ? user.preferences.toObject() : {};

    // Validate and update Notification Preferences
    if (notifications) {
      updatedPreferences.notifications = {
        email: typeof notifications.email === 'boolean' ? notifications.email : updatedPreferences.notifications?.email ?? true,
        inApp: typeof notifications.inApp === 'boolean' ? notifications.inApp : updatedPreferences.notifications?.inApp ?? true,
        taskAssignment: typeof notifications.taskAssignment === 'boolean' ? notifications.taskAssignment : updatedPreferences.notifications?.taskAssignment ?? true,
        taskStatus: typeof notifications.taskStatus === 'boolean' ? notifications.taskStatus : updatedPreferences.notifications?.taskStatus ?? true,
        comments: typeof notifications.comments === 'boolean' ? notifications.comments : updatedPreferences.notifications?.comments ?? true,
      };
    }

    // Validate and update Reminder Preferences
    if (reminders) {
      const allowedOffsets = ['due_time', '10_min_before', '30_min_before', '1_hour_before', '1_day_before'];
      const currentOffset = updatedPreferences.reminders?.defaultOffset ?? '10_min_before';
      
      updatedPreferences.reminders = {
        enabled: typeof reminders.enabled === 'boolean' ? reminders.enabled : updatedPreferences.reminders?.enabled ?? true,
        defaultOffset: allowedOffsets.includes(reminders.defaultOffset) ? reminders.defaultOffset : currentOffset,
      };
    }

    // Validate and update Appearance Preferences
    if (appearance) {
      const allowedThemes = ['system', 'light', 'dark'];
      const currentTheme = updatedPreferences.appearance?.theme ?? 'system';
      
      updatedPreferences.appearance = {
        theme: allowedThemes.includes(appearance.theme) ? appearance.theme : currentTheme,
      };
    }

    user.preferences = updatedPreferences;
    const updatedUser = await user.save();

    res.json(updatedUser.preferences);
  } catch (error) {
    console.error('Update settings error:', error.message);
    res.status(500).json({ message: 'Server error updating settings' });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
