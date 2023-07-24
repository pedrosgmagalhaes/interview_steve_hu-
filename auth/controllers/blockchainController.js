
const BlockchainTxn = require('../models/Blockchain');

exports.saveBlockchainTransaction = async (req, res) => {
    try {
        const newTxn = new BlockchainTxn(req.body);
        await newTxn.save();

        res.status(201).json({
            success: true,
            transaction: newTxn
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};
