const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authAdmin = require('../middleware/authAdmin');
const optionalAdmin = require('../middleware/optionalAdmin');
const objectIdParam = require('../middleware/objectIdParam');

router.param('id', objectIdParam);

// Public reads show live transfers only; admins (optionalAdmin) also see hidden ones.
router.get('/', optionalAdmin, transferController.getTransfers);
router.get('/:id', optionalAdmin, transferController.getTransfer);
router.post('/', authAdmin, transferController.createTransfer);
router.put('/:id', authAdmin, transferController.updateTransfer);
router.delete('/:id', authAdmin, transferController.deleteTransfer);

module.exports = router;