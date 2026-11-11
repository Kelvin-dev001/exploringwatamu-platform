const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authAdmin = require('../middleware/authAdmin');
const { adminWriteLimiter } = require('../middleware/rateLimiters');
const optionalAdmin = require('../middleware/optionalAdmin');
const objectIdParam = require('../middleware/objectIdParam');

router.param('id', objectIdParam);

// Public reads show live transfers only; admins (optionalAdmin) also see hidden ones.
router.get('/', optionalAdmin, transferController.getTransfers);
router.get('/:id', optionalAdmin, transferController.getTransfer);
router.post('/', adminWriteLimiter, authAdmin, transferController.createTransfer);
router.put('/:id', adminWriteLimiter, authAdmin, transferController.updateTransfer);
router.delete('/:id', adminWriteLimiter, authAdmin, transferController.deleteTransfer);

module.exports = router;