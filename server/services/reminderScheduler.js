const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');
const Task = require('../models/Task');

// Function to start the reminder scheduler
const startReminderScheduler = () => {
  console.log('⏳ Starting Reminder Scheduler...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find pending reminders where remindAt is in the past or now
      const pendingReminders = await Reminder.find({
        status: 'pending',
        remindAt: { $lte: now },
      }).populate('taskId userId', 'title name');

      if (pendingReminders.length > 0) {
        console.log(`Found ${pendingReminders.length} pending reminders to process.`);
      }

      for (const reminder of pendingReminders) {
        // Create an in-app notification
        const task = reminder.taskId;
        if (task && reminder.userId) {
          await Notification.create({
            userId: reminder.userId._id,
            message: `Reminder: Task "${task.title}" is due soon.`,
            link: `/projects/${task.projectId}?task=${task._id}`,
          });

          // Update reminder status
          reminder.status = 'sent';
          await reminder.save();
        } else {
           // Task or User might have been deleted, just cancel it
           reminder.status = 'cancelled';
           await reminder.save();
        }
      }
    } catch (error) {
      console.error('Error in reminder scheduler:', error);
    }
  });
};

module.exports = { startReminderScheduler };
