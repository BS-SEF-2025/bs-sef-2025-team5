const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

// POST /api/auth/verify-admin
router.post('/verify-admin', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Admin code is required'
            });
        }

        const admin = await Admin.findOne();

        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'No admin configured'
            });
        }

        const isValid = await bcrypt.compare(code, admin.admin_code);

        if (isValid) {
            return res.json({
                success: true,
                message: 'Admin verified'
            });
        } else {
            return res.status(401).json({
                success: false,
                error: 'Invalid admin code'
            });
        }

    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /api/auth/setup-admin (run once to create admin)
router.post('/setup-admin', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Admin code is required'
            });
        }

        const existingAdmin = await Admin.findOne();
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                error: 'Admin already configured'
            });
        }

        const hashedCode = await bcrypt.hash(code, 10);

        const admin = new Admin({
            admin_code: hashedCode
        });

        await admin.save();

        res.status(201).json({
            success: true,
            message: 'Admin created successfully'
        });

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;