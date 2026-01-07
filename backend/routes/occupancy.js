const express = require('express');
const router = express.Router();
const Occupancy = require('../models/Occupancy');

// POST /api/occupancy/update
router.post('/update', async (req, res) => {
    try {
        const { timestamp, current_count, direction } = req.body;

        // Validation: Check required fields
        if (!timestamp) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: timestamp'
            });
        }

        if (current_count === undefined || current_count === null) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: current_count'
            });
        }

        // Validation: Check types
        if (typeof current_count !== 'number') {
            return res.status(400).json({
                success: false,
                error: 'current_count must be a number'
            });
        }

        if (current_count < 0) {
            return res.status(400).json({
                success: false,
                error: 'current_count cannot be negative'
            });
        }

        // Validation: Check direction if provided
        if (direction && !['IN', 'OUT'].includes(direction)) {
            return res.status(400).json({
                success: false,
                error: 'direction must be either "IN" or "OUT"'
            });
        }

        // Validate timestamp format
        const parsedTimestamp = new Date(timestamp);
        if (isNaN(parsedTimestamp.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Invalid timestamp format'
            });
        }

        // Create and save record
        const occupancyRecord = new Occupancy({
            timestamp: parsedTimestamp,
            current_count,
            direction: direction || undefined
        });

        const saved = await occupancyRecord.save();

        return res.status(201).json({
            success: true,
            id: saved._id,
            data: {
                timestamp: saved.timestamp,
                current_count: saved.current_count,
                direction: saved.direction
            }
        });

    } catch (error) {
        console.error('Error saving occupancy data:', error);
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /api/occupancy - Get all records (useful for testing)
router.get('/', async (req, res) => {
    try {
        const records = await Occupancy.find().sort({ timestamp: -1 }).limit(100);
        res.json({
            success: true,
            count: records.length,
            data: records
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /api/occupancy/latest - Get latest count
router.get('/latest', async (req, res) => {
    try {
        const latest = await Occupancy.findOne().sort({ timestamp: -1 });
        if (!latest) {
            return res.json({
                success: true,
                data: null,
                message: 'No records found'
            });
        }
        res.json({
            success: true,
            data: latest
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});


// GET /api/occupancy/today - Get today's summary
router.get('/today', async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const todayRecords = await Occupancy.find({
            timestamp: { $gte: today }
        }).sort({ timestamp: -1 });

        if (todayRecords.length === 0) {
            return res.json({
                success: true,
                data: {
                    date: today.toISOString().split('T')[0],
                    total_in: 0,
                    total_out: 0,
                    current_inside: 0,
                    peak_count: 0,
                    peak_hour: null,
                    avg_today: 0,
                    records_today: 0
                }
            });
        }

        const total_in = todayRecords.filter(r => r.direction === 'IN').length;
        const total_out = todayRecords.filter(r => r.direction === 'OUT').length;
        const current_inside = todayRecords[0].current_count || 0;
        
        // Find peak count and peak hour
        let peak_count = 0;
        let peak_record = null;
        
        todayRecords.forEach(record => {
            if ((record.current_count || 0) > peak_count) {
                peak_count = record.current_count;
                peak_record = record;
            }
        });

        // Format peak hour (e.g., "2:30 PM")
        let peak_hour = null;
        if (peak_record) {
            const peakTime = new Date(peak_record.timestamp);
            peak_hour = peakTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
        }

        // Calculate average occupancy today
        const counts = todayRecords.map(r => r.current_count || 0);
        const avg_today = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);

        res.json({
            success: true,
            data: {
                date: today.toISOString().split('T')[0],
                total_in,
                total_out,
                current_inside,
                peak_count,
                peak_hour,
                avg_today,
                records_today: todayRecords.length
            }
        });

    } catch (error) {
        console.error('Error getting today stats:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});


// GET /api/occupancy/today-trend - Get hourly trend for today
router.get('/today-trend', async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const todayRecords = await Occupancy.find({
            timestamp: { $gte: today }
        }).sort({ timestamp: 1 });

        if (todayRecords.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Group by hour
        const hourlyData = {};
        
        todayRecords.forEach(record => {
            const hour = new Date(record.timestamp).getHours();
            const timeKey = `${hour.toString().padStart(2, '0')}:00`;
            
            // Keep the latest count for each hour
            hourlyData[timeKey] = record.current_count || 0;
        });

        // Convert to array
        const trend = Object.entries(hourlyData)
            .map(([time, count]) => ({ time, count }))
            .sort((a, b) => a.time.localeCompare(b.time));

        res.json({
            success: true,
            data: trend
        });

    } catch (error) {
        console.error('Error getting today trend:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
module.exports = router;
