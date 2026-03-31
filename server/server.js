require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { startReminderScheduler } = require('./services/reminderScheduler');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start cron jobs
startReminderScheduler();

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
