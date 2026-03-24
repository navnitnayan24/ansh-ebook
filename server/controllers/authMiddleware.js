const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('❌ FATAL: JWT_SECRET is not defined!');
            return res.status(500).json({ error: 'Auth server misconfigured' });
        }
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('🔓 [AUTH ERROR] Token Verification Failed:', err.message);
        res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
    }
};

exports.isAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin only.' });
        }
        
        // Extra hardening: Check if this admin actually exists in the DB
        const adminExists = await Admin.findById(req.user.id);
        if (!adminExists) {
            console.warn('⛔ [ADMIN ERROR] Record not found for ID:', req.user.id);
            return res.status(403).json({ error: 'Access denied. Valid admin record not found in current database.' });
        }
        
        next();
    } catch (err) {
        res.status(500).json({ error: 'Internal security check failed.' });
    }
};
