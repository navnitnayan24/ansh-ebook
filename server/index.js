require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { connectDB } = require('./db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Routes
const contentRoutes = require('./routes/contentRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000; 

// Middleware
app.use(cors());
app.use(express.json());

let lastDbError = null;

// Health Check
app.get('/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
    let adminInfo = 'N/A';
    try {
        if (dbStatus === 'CONNECTED') {
            const Admin = require('./models/Admin');
            const count = await Admin.countDocuments();
            adminInfo = `Connected. Found ${count} admins.`;
        }
    } catch (err) {
        adminInfo = `Error: ${err.message}`;
    }
    
    res.json({ 
        status: 'OK', 
        database: dbStatus, 
        adminInfo,
        lastError: lastDbError ? lastDbError.message : null,
        timestamp: new Date() 
    });
});

// Temporary Admin Audit (Safe)
app.get('/api/admin-audit', async (req, res) => {
    try {
        const Admin = require('./models/Admin');
        const admins = await Admin.find({}, { password: 0 }); // Hide passwords
        res.json({ count: admins.length, admins });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Force Admin Reset
app.get('/api/force-admin-reset', async (req, res) => {
    try {
        const { connectDB } = require('./db');
        const Admin = require('./models/Admin');
        const bcrypt = require('bcryptjs');
        
        const adminUsername = 'anshsharma2026';
        const adminEmail = 'anshbgmi24@gmail.com';
        const adminPassword = await bcrypt.hash('ansh@sh2002', 10);

        const admin = await Admin.findOneAndUpdate(
            { $or: [{ username: adminUsername }, { email: adminEmail }] },
            { username: adminUsername, password: adminPassword, email: adminEmail, profile_name: 'Ansh Sharma' },
            { upsert: true, new: true }
        );

        res.json({ message: 'ADMIN ACCOUNT RESET SUCCESSFUL', admin: { username: admin.username, email: admin.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Serve uploads
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
app.use('/uploads', (req, res) => {
    res.status(404).json({ error: 'Media file not found. Ensure Cloudinary is properly configured or file exists on disk.' });
});

// API Routes - Order matters: Specific to General
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', contentRoutes);

// Serve static files from the React app
const distPath = path.resolve(__dirname, '../frontend/dist');
console.log('Serving production assets from:', distPath);
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Catch-all wildcard for React SPA - MUST be the last route
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    // Exclude API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API Endpoint Not Found' });
    }
    
    // Serve index.html for all other GET requests (SPA)
    const indexPath = path.resolve(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend build not found. Please run "npm run build" in the frontend directory.');
    }
});

// Start Server
async function startServer() {
    try {
        // Connect to DB and WAIT before starting
        console.log('⏳ Connecting to MongoDB...');
        await connectDB();
        
        const server = app.listen(PORT, () => {
            console.log(`🚀 Premium MERN Server live on port ${PORT}`);
            console.log(`📱 Access on your network at: http://${getIPAddress()}:${PORT}`);
        });

        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error(`💥 Port ${PORT} is already in use.`);
            } else {
                console.error('💥 Server Error:', e);
            }
        });
    } catch (err) {
        lastDbError = err;
        console.error('💥 Failed to start server:', err);
        // Don't exit(1) on Render so we can at least see the health check error
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
}

function getIPAddress() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '0.0.0.0';
}

startServer();
