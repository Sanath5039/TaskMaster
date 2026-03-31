const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getSettings, updateSettings } = require('../controllers/settingController');

// All settings routes are protected
router.use(protect);

router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
