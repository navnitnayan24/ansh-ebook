require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const { connectDB } = require('./db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contentRoutes = require('./routes/contentRoutes');

const app = express();
const PORT = process.env.PORT || 5000; 

// Security Middleware
app.use(helmet()); 
app.use(mongoSanitize()); 

// Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth/login', apiLimiter);
app.use('/api/auth/admin/login', apiLimiter);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let lastDbError = null;

// Health Check
app.get('/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
    const storageType = (process.env.CLOUDINARY_CLOUD_NAME || 'datao7ela') ? 'cloudinary' : 'local';
    let stats = { admins: 0, users: 0, subscribers: 0 };
    try {
        if (dbStatus === 'CONNECTED') {
            const Admin = require('./models/Admin');
            const User = require('./models/User');
            let Subscriber;
            try { Subscriber = require('./models/Subscriber'); } catch(e) {}
            
            stats.admins = await Admin.countDocuments();
            stats.users = await User.countDocuments();
            if (Subscriber) stats.subscribers = await Subscriber.countDocuments();
        }
    } catch (err) {
        console.error('Health Check Error:', err);
    }
    
    res.json({ 
        status: 'OK', 
        database: dbStatus, 
        storageType,
        stats,
        lastError: lastDbError ? lastDbError.message : null,
        timestamp: new Date() 
    });
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', contentRoutes);

// Serve static files from the React app
const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Catch-all wildcard for React SPA
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API Endpoint Not Found' });
    }
    
    const indexPath = path.resolve(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend build not found.');
    }
});

// Start Server
async function startServer() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await connectDB();
        
        const server = app.listen(PORT, () => {
            console.log(`🚀 Premium MERN Server live on port ${PORT}`);
        });

        server.timeout = 600000;

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
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
}

startServer();
