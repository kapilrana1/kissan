const express = require('express');
const router = express.Router();
const wheatEntryController = require('../controllers/wheatEntryController');
const { requireLogin } = require('../middleware/auth');

router.get('/wheat-entries', requireLogin, wheatEntryController.index);
router.get('/wheat-entries/export', requireLogin, wheatEntryController.exportAll);

module.exports = router;
