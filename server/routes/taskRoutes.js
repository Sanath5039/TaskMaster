const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/reorder').put(protect, reorderTasks);
router.route('/my').get(protect, getMyTasks);

// Create task — optional file upload via multipart/form-data
router.route('/').post(protect, upload.single('attachment'), createTask);

router.route('/project/:projectId').get(protect, getTasksByProject);
router.route('/:id').put(protect, updateTask).delete(protect, deleteTask);

// Review workflow
router.post('/:id/submit-review', protect, submitForReview);
router.post('/:id/approve',       protect, approveTask);
router.post('/:id/reject',        protect, rejectTask);

// File download
router.get('/:id/download', protect, downloadAttachment);

module.exports = router;
