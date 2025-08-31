const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const authAdmin = require('../middleware/authAdmin');

router.get('/', transferController.getTransfers);
router.get('/:id', transferController.getTransfer);
router.post('/', authAdmin, transferController.createTransfer);
router.put('/:id', authAdmin, transferController.updateTransfer);
router.delete('/:id', authAdmin, transferController.deleteTransfer);

module.exports = router;