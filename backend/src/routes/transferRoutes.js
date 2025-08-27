const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');

router.get('/', transferController.getTransfers);
router.post('/', transferController.createTransfer);
router.put('/:id', transferController.updateTransfer);
router.delete('/:id', transferController.deleteTransfer);

module.exports = router;