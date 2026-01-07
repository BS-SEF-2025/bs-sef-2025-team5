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


// GET /api/occupancy/weekly - Get data for a specific week
router.get('/weekly', async (req, res) => {
    try {
        // Get week start date from query param, default to current week
        let startDate;
        if (req.query.week) {
            startDate = new Date(req.query.week);
        } else {
            // Get start of current week (Sunday)
            startDate = new Date();
            startDate.setDate(startDate.getDate() - startDate.getDay());
        }
        startDate.setHours(0, 0, 0, 0);

        // End of week (Saturday)
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        // Get all records for the week
        const weekRecords = await Occupancy.find({
            timestamp: { $gte: startDate, $lt: endDate }
        }).sort({ timestamp: 1 });

        // Group records by day
        const dailyData = {};
        
        weekRecords.forEach(record => {
            const date = new Date(record.timestamp);
            const dateKey = date.toISOString().split('T')[0];
            
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    date: dateKey,
                    day: date.toLocaleDateString('en-US', { weekday: 'long' }),
                    records: [],
                    hourly_counts: {}
                };
            }
            
            dailyData[dateKey].records.push(record);
            
            // Track counts by hour
            const hour = date.getHours();
            if (!dailyData[dateKey].hourly_counts[hour]) {
                dailyData[dateKey].hourly_counts[hour] = [];
            }
            dailyData[dateKey].hourly_counts[hour].push(record.current_count || 0);
        });

        // Calculate busiest and freest hours for each day
        const weekSummary = Object.values(dailyData).map(day => {
            const hourlyAvg = {};
            
            // Calculate average count per hour
            Object.entries(day.hourly_counts).forEach(([hour, counts]) => {
                hourlyAvg[hour] = counts.reduce((a, b) => a + b, 0) / counts.length;
            });

            const hours = Object.entries(hourlyAvg);
            
            if (hours.length === 0) {
                return {
                    date: day.date,
                    day: day.day,
                    busiest_hour: null,
                    freest_hour: null,
                    total_in: 0,
                    total_out: 0,
                    peak_count: 0
                };
            }

            // Find busiest and freest hours
            const busiest = hours.reduce((max, curr) => curr[1] > max[1] ? curr : max);
            const freest = hours.reduce((min, curr) => curr[1] < min[1] ? curr : min);

            const formatHour = (h) => {
                const hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const displayHour = hour % 12 || 12;
                return `${displayHour}:00 ${ampm}`;
            };

            return {
                date: day.date,
                day: day.day,
                busiest_hour: formatHour(busiest[0]),
                freest_hour: formatHour(freest[0]),
                total_in: day.records.filter(r => r.direction === 'IN').length,
                total_out: day.records.filter(r => r.direction === 'OUT').length,
                peak_count: Math.max(...day.records.map(r => r.current_count || 0))
            };
        });

        // Sort by date
        weekSummary.sort((a, b) => a.date.localeCompare(b.date));

        res.json({
            success: true,
            data: {
                week_start: startDate.toISOString().split('T')[0],
                week_end: new Date(endDate.getTime() - 1).toISOString().split('T')[0],
                days: weekSummary
            }
        });

    } catch (error) {
        console.error('Error getting weekly data:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// GET /api/occupancy/recent - Get recent activity log
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const recentRecords = await Occupancy.find({
            direction: { $exists: true, $ne: null }
        })
        .sort({ timestamp: -1 })
        .limit(limit);

        const activities = recentRecords.map(record => {
            const timestamp = new Date(record.timestamp);
            const time = timestamp.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            return {
                type: record.direction === 'IN' ? 'entry' : 'exit',
                time: time,
                count_change: record.direction === 'IN' ? '+1' : '-1',
                current_count: record.current_count,
                timestamp: record.timestamp
            };
        });

        res.json({
            success: true,
            data: activities
        });

    } catch (error) {
        console.error('Error getting recent activity:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
module.exports = router;
