const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireLogin } = require('../middleware/auth');

router.get('/dashboard', requireLogin, dashboardController.index);

module.exports = router;
