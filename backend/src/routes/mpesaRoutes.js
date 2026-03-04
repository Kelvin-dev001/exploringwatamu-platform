const express = require('express');
const router = express.Router();
const mpesaController = require('../controllers/mpesaController');
const authUser = require('../middleware/authUser');

router.post('/stkpush', authUser, mpesaController.stkPush);
router.post('/callback', mpesaController.mpesaCallback);
router.post('/query', authUser, mpesaController.queryTransaction);

module.exports = router;
