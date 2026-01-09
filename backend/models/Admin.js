const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    admin_code: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Admin', adminSchema);