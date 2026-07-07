const express = require('express');
const router = express.Router();
const farmerController = require('../controllers/farmerController');
const wheatEntryController = require('../controllers/wheatEntryController');
const { requireLogin } = require('../middleware/auth');

router.use(requireLogin);

router.get('/', farmerController.list);
router.get('/new', farmerController.showAddForm);
router.get('/export', farmerController.exportList);
router.post('/', farmerController.create);
router.get('/:id', farmerController.view);
router.get('/:id/edit', farmerController.showEditForm);
router.get('/:id/export', farmerController.exportEntries);
router.put('/:id', farmerController.update);
router.delete('/:id', farmerController.delete);

router.post('/:id/entries', wheatEntryController.create);
router.delete('/:id/entries/:entryId', wheatEntryController.delete);

module.exports = router;
