const mongoose = require('mongoose');

const occupancySchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: [true, 'Timestamp is required']
    },
    current_count: {
        type: Number,
        required: [true, 'Current count is required'],
        min: [0, 'Count cannot be negative']
    },
    direction: {
        type: String,
        enum: {
            values: ['IN', 'OUT'],
            message: 'Direction must be either "IN" or "OUT"'
        },
        required: false
    }
}, {
    timestamps: true  // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Occupancy', occupancySchema);
