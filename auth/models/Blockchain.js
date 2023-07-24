const mongoose = require('mongoose');

const blockchainTxnSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    value: {
        type: Number,
        required: true
    },
    txnHash: {
        type: String,
        required: true
    },
    blockNumber: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("BlockchainTxn", blockchainTxnSchema);
