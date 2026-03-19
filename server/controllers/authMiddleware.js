const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

exports.authenticate = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token.' });
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
            console.log('⛔ Admin record not found for ID:', req.user.id);
            return res.status(403).json({ error: 'Access denied. Invalid admin record.' });
        }
        
        next();
    } catch (err) {
        res.status(500).json({ error: 'Internal security check failed.' });
    }
};
