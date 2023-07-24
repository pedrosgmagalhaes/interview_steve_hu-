const express = require('express');
const { saveBlockchainTransaction } = require('../controllers/blockchainController');

const router = express.Router();

router.route('/blockchainTransaction').post(saveBlockchainTransaction);

module.exports = router;